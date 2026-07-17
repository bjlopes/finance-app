"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt, Tag, ChevronLeft, ChevronRight, Check, ChevronDown, X } from "lucide-react";
import { buildTagSpendingHierarchy } from "@/lib/tags-utils";
import { GastosPorTagHierarquico } from "@/components/GastosPorTagHierarquico";
import { DonutChart } from "@/components/DonutChart";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { getMesEfetivo } from "@/lib/fluxoCaixa";
import { isFluxoReal, isTransacaoInvestimento, isContaInvestimento, calcularMovimentosInvestimento, calcularSaldoMes, calcularSaldosContaMes, somarSaldoPorContaMes, totalReceitasDashboard, totalGastosDashboard, getContaDestinoTransferencia, getContaOrigemTransferencia } from "@/lib/transferencias";
import { formatLocalDate } from "@/lib/dateUtils";
import { compareTransacoesDesc } from "@/lib/transacoes-utils";

const DASHBOARD_CONTAS_KEY = "finance-app-dashboard-contas";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function loadDashboardContas(contas: { nome: string }[]): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DASHBOARD_CONTAS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return null;
    if (parsed.length === 0) return [];
    const valid = parsed.filter((c) => contas.some((x) => x.nome === c));
    return valid.length === contas.length ? null : valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

function saveDashboardContas(ids: string[] | null) {
  if (typeof window === "undefined") return;
  if (ids === null) {
    localStorage.removeItem(DASHBOARD_CONTAS_KEY);
  } else {
    localStorage.setItem(DASHBOARD_CONTAS_KEY, JSON.stringify(ids));
  }
}

export default function DashboardPage() {
  const { transacoes, tags, contas, loading, loadSampleData } = useData();

  const now = new Date();
  const mesAtualPadrao = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualPadrao);
  const [contasDashboard, setContasDashboard] = useState<string[] | null>(null);
  const [contasDropdownOpen, setContasDropdownOpen] = useState(false);
  const [receitasModalOpen, setReceitasModalOpen] = useState(false);
  const [aportesModalOpen, setAportesModalOpen] = useState(false);
  const [resgatesModalOpen, setResgatesModalOpen] = useState(false);
  const [contaSaldoModal, setContaSaldoModal] = useState<string | null>(null);
  const contasDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadDashboardContas(contas);
    setContasDashboard(saved);
  }, [contas]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (contasDropdownRef.current && !contasDropdownRef.current.contains(e.target as Node)) {
        setContasDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const contasAtivas = contasDashboard ?? contas.map((c) => c.nome);
  const toggleConta = (nome: string) => {
    const next = contasAtivas.includes(nome)
      ? contasAtivas.filter((c) => c !== nome)
      : [...contasAtivas, nome];
    const toSave = next.length === contas.length ? null : next;
    setContasDashboard(toSave);
    saveDashboardContas(toSave);
  };
  const selectAll = () => {
    setContasDashboard(null);
    saveDashboardContas(null);
  };

  const stats = useMemo(() => {
    let transacoesMes = transacoes.filter(
      (t) => getMesEfetivo(t, contas) === mesSelecionado
    );
    transacoesMes = transacoesMes.filter((t) => contasAtivas.includes(t.conta));

    const gastos = transacoesMes.filter(
      (t) => t.valor < 0 && isFluxoReal(t) && !isTransacaoInvestimento(t, contas, tags)
    );
    const receitas = transacoesMes.filter(
      (t) => t.valor > 0 && isFluxoReal(t) && !isTransacaoInvestimento(t, contas, tags)
    );
    const gastosFluxo = gastos.reduce((sum, t) => sum + Math.abs(t.valor), 0);
    const receitasFluxo = receitas.reduce((sum, t) => sum + t.valor, 0);

    const temContaInvestimento = contas.some((c) => c.isInvestimento);
    const investimento = calcularMovimentosInvestimento(
      transacoes,
      contas,
      mesSelecionado,
      (t) => getMesEfetivo(t, contas),
      contasAtivas,
      tags
    );

    const totalGastos = totalGastosDashboard(gastosFluxo);
    const totalReceitas = totalReceitasDashboard(receitasFluxo);
    const saldo = calcularSaldoMes(totalReceitas, totalGastos);

    const gastosPorTagId: Record<string, number> = {};
    gastos.forEach((t) => {
      t.tagIds.forEach((tagId) => {
        gastosPorTagId[tagId] = (gastosPorTagId[tagId] || 0) + Math.abs(t.valor);
      });
    });

    const tagHierarchy = buildTagSpendingHierarchy(tags, gastosPorTagId);

    const saldosConta = calcularSaldosContaMes(
      transacoes,
      transacoesMes,
      contas,
      mesSelecionado,
      contasAtivas
    );
    const { saldoInicial: saldoInicialPorConta, movimentoMes: movimentoPorConta, saldoFinal: saldoFinalPorConta } =
      saldosConta;
    // Só contas de caixa: carry-over começa em jul/2026; aportes reduzem o saldo da origem.
    const somaCaixaMes = somarSaldoPorContaMes(saldoFinalPorConta, contas, "caixa");

    const topContas = Object.entries(saldoFinalPorConta)
      .filter(([, saldo]) => saldo !== 0)
      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));

    const maioresGastos = [...gastos]
      .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
      .slice(0, 5);

    const [ano, mes] = mesSelecionado.split("-").map(Number);
    return {
      mesLabel: `${MESES[mes - 1]} ${ano}`,
      totalGastosMes: totalGastos,
      totalReceitasMes: totalReceitas,
      gastosFluxo,
      receitasFluxo,
      saldoMes: saldo,
      somaCaixaMes,
      saldoInicialPorConta,
      movimentoPorConta,
      saldoFinalPorConta,
      tagHierarchy,
      gastos,
      receitas,
      topContas,
      maioresGastos,
      qtdTransacoesMes: transacoesMes.length,
      qtdGastos: gastos.length,
      qtdReceitas: receitas.length,
      totalTransacoes: transacoes.length,
      temContaInvestimento,
      investimento,
    };
  }, [transacoes, tags, contas, mesSelecionado, contasAtivas]);

  const transacoesContaSaldoDetalhe = useMemo(() => {
    if (!contaSaldoModal) return [];
    return transacoes
      .filter(
        (t) =>
          getMesEfetivo(t, contas) === mesSelecionado &&
          contasAtivas.includes(t.conta) &&
          t.conta === contaSaldoModal
      )
      .sort(compareTransacoesDesc);
  }, [contaSaldoModal, transacoes, contas, mesSelecionado, contasAtivas]);

  const movimentoContaModal = useMemo(
    () => transacoesContaSaldoDetalhe.reduce((s, t) => s + t.valor, 0),
    [transacoesContaSaldoDetalhe]
  );

  const saldoInicialContaModal = contaSaldoModal
    ? stats.saldoInicialPorConta[contaSaldoModal] ?? 0
    : 0;

  const saldoFinalContaModal = saldoInicialContaModal + movimentoContaModal;

  const formatBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500">Carregando...</div>
      </div>
    );
  }

  const mudarMes = (delta: number) => {
    const [ano, mes] = mesSelecionado.split("-").map(Number);
    const d = new Date(ano, mes - 1 + delta, 1);
    setMesSelecionado(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const contasLabelLong =
    contasAtivas.length === contas.length
      ? "Todas as contas"
      : `${contasAtivas.length} de ${contas.length} contas`;
  const contasLabelShort =
    contasAtivas.length === contas.length
      ? "Todas"
      : `${contasAtivas.length}/${contas.length}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 phone:gap-2.5 sm:flex-row sm:items-start sm:justify-between ipad:gap-4">
        <div className="min-w-0">
          <h1 className="text-[length:var(--fluid-text-2xl)] font-bold text-slate-100">Dashboard</h1>
          <p className="text-[length:var(--fluid-text-sm)] text-slate-400 mt-1">{stats.mesLabel}</p>
        </div>
        <div className="flex flex-col gap-2 w-full sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end sm:w-auto sm:max-w-full sm:shrink-0">
          {contas.length > 0 && (
          <div className="relative w-full sm:w-auto" ref={contasDropdownRef}>
            <button
              type="button"
              onClick={() => setContasDropdownOpen((o) => !o)}
              className="flex items-center gap-2 min-h-[44px] w-full sm:w-auto max-w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700/50 text-sm"
            >
              <Wallet size={18} className="shrink-0" />
              <span className="truncate min-w-0 flex-1 sm:flex-none text-left">
                <span className="sm:hidden">{contasLabelShort}</span>
                <span className="hidden sm:inline">{contasLabelLong}</span>
              </span>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${contasDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {contasDropdownOpen && (
              <div
                className="modal-overlay"
                onClick={() => setContasDropdownOpen(false)}
              >
                <div
                  className="modal-content-centered w-full max-w-sm overflow-y-auto rounded-xl bg-slate-800 border border-slate-700 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 sticky top-0 bg-slate-800">
                    <span className="text-sm font-medium text-slate-300">Contas no dashboard</span>
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs text-brand-400 hover:text-brand-300"
                    >
                      Todas
                    </button>
                  </div>
                  <div className="p-2">
                  {contas.map((c) => {
                    const checked = contasAtivas.includes(c.nome);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-700/50 min-w-0"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleConta(c.nome)}
                          className="sr-only"
                        />
                        <span className="w-5 h-5 flex items-center justify-center rounded border border-slate-600 bg-slate-900 shrink-0">
                          {checked && <Check size={14} className="text-brand-400" />}
                        </span>
                        <span className="text-sm text-slate-200 truncate">{c.nome}</span>
                      </label>
                    );
                  })}
                  </div>
                </div>
              </div>
            )}
          </div>
          )}
          <div className="flex items-center justify-between gap-1 w-full sm:w-auto sm:justify-end sm:flex-nowrap">
            <button
              type="button"
              onClick={() => mudarMes(-1)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 shrink-0"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <input
              type="month"
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="flex-1 min-w-0 max-w-none sm:flex-none sm:w-[9.5rem] px-2 phone:px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 min-h-[44px]"
            />
            <button
              type="button"
              onClick={() => mudarMes(1)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 shrink-0"
              aria-label="Próximo mês"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-5 phone:p-4 tablet:p-6">
        <div className="grid grid-cols-1 gap-6 phone:gap-4 lg:grid-cols-[1fr,auto] lg:items-start lg:gap-8 ipad:grid-cols-[1fr,minmax(260px,320px)] ipad:gap-10">
          {/* Coluna esquerda: Fluxo + Gastos por tag + conta + maiores (uma coluna só no iPad landscape) */}
          <div className="space-y-6 lg:pr-6 lg:border-r lg:border-slate-700/50 lg:min-w-0 ipad:pr-8 ipad:min-w-0">
            <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-700/50 pb-3">
              Fluxo do mês
            </h2>
            <p className="text-xs text-slate-500 -mt-4">
              Custo de vida — aportes e resgates ficam em Investimentos
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <TrendingDown size={16} />
                  Gastos
                </div>
                <p className="text-lg font-bold text-red-400">
                  {formatBRL(stats.totalGastosMes)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stats.qtdGastos} {stats.qtdGastos === 1 ? "transação" : "transações"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => stats.qtdReceitas > 0 && setReceitasModalOpen(true)}
                className={`text-left ${stats.qtdReceitas > 0 ? "cursor-pointer hover:opacity-90" : "cursor-default"}`}
              >
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <TrendingUp size={16} />
                  Receitas
                </div>
                <p className="text-lg font-bold text-brand-400">
                  {formatBRL(stats.totalReceitasMes)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stats.qtdReceitas} {stats.qtdReceitas === 1 ? "transação" : "transações"}
                </p>
              </button>
            </div>

            <div className="py-3 border-y border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Wallet size={18} />
                  <span className="font-medium">Saldo do mês</span>
                </div>
                <p
                  className={`text-lg font-bold ${
                    stats.saldoMes >= 0 ? "text-brand-400" : "text-red-400"
                  }`}
                >
                  {formatBRL(stats.saldoMes)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <Receipt size={16} />
                Total no mês
              </span>
              <span>{stats.qtdTransacoesMes} transações</span>
            </div>

            {(stats.temContaInvestimento ||
              stats.investimento.aportes > 0 ||
              stats.investimento.resgates > 0) && (
              <div className="pt-3 border-t border-slate-700/50 space-y-3">
                <h3 className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                  <TrendingUp size={16} className="text-emerald-400" />
                  Investimentos
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      stats.investimento.qtdAportes > 0 && setAportesModalOpen(true)
                    }
                    className={`text-left ${
                      stats.investimento.qtdAportes > 0
                        ? "cursor-pointer hover:opacity-90"
                        : "cursor-default"
                    }`}
                  >
                    <p className="text-xs text-slate-500 mb-1">Aportes no mês</p>
                    <p className="text-lg font-bold text-emerald-400 tabular-nums">
                      {formatBRL(stats.investimento.aportes)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {stats.investimento.qtdAportes}{" "}
                      {stats.investimento.qtdAportes === 1 ? "transferência" : "transferências"}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      stats.investimento.qtdResgates > 0 && setResgatesModalOpen(true)
                    }
                    className={`text-left ${
                      stats.investimento.qtdResgates > 0
                        ? "cursor-pointer hover:opacity-90"
                        : "cursor-default"
                    }`}
                  >
                    <p className="text-xs text-slate-500 mb-1">Resgates no mês</p>
                    <p className="text-lg font-bold text-sky-400 tabular-nums">
                      {formatBRL(stats.investimento.resgates)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {stats.investimento.qtdResgates}{" "}
                      {stats.investimento.qtdResgates === 1 ? "transferência" : "transferências"}
                    </p>
                  </button>
                </div>
                {!stats.temContaInvestimento && (
                  <p className="text-xs text-amber-400/90">
                    Marque sua conta em{" "}
                    <Link href="/contas" className="text-brand-400 hover:underline">
                      Contas
                    </Link>{" "}
                    como investimento para contabilizar aportes automaticamente.
                  </p>
                )}
              </div>
            )}

            {stats.tagHierarchy.length > 0 && (
              <div className="pt-2 border-t border-slate-700/50">
                <h3 className="flex items-center gap-2 text-slate-300 font-medium mb-3">
                  <Tag size={16} />
                  Gastos por tag
                </h3>
                <div className="mb-4 lg:hidden">
                  <DonutChart
                    data={stats.tagHierarchy.map((n) => ({
                      label: n.tag.nome,
                      value: n.total,
                      color: n.tag.cor || "#6366f1",
                    }))}
                    total={stats.gastosFluxo}
                    formatValue={formatBRL}
                  />
                </div>
                <GastosPorTagHierarquico
                  nodes={stats.tagHierarchy}
                  totalGastos={stats.gastosFluxo}
                  formatBRL={formatBRL}
                  gastos={stats.gastos}
                  tags={tags}
                />
              </div>
            )}

            {stats.topContas.length > 0 && (
              <div className="pt-2 border-t border-slate-700/50">
                <h3 className="text-slate-300 font-medium">Saldo por conta</h3>
                <p className="text-xs text-slate-500 mb-3 mt-0.5">
                  Carry-over automático a partir de julho/2026 (aportes saem da conta de origem)
                </p>
                <ul className="space-y-1">
                  {stats.topContas.map(([conta, saldo]) => (
                    <li key={conta}>
                      <button
                        type="button"
                        onClick={() => setContaSaldoModal(conta)}
                        className="flex w-full justify-between items-center gap-2 text-sm text-slate-400 rounded-lg px-2 py-2.5 text-left hover:bg-slate-800/50 active:bg-slate-800/70 transition-colors min-h-[44px]"
                      >
                        <span className="truncate text-slate-300">{conta}</span>
                        <span className={`font-medium shrink-0 ${saldo >= 0 ? "text-brand-400" : "text-red-400"}`}>
                          {formatBRL(saldo)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-slate-700/40 flex justify-between text-sm text-slate-400">
                  <span>Total caixa</span>
                  <span className={`font-medium tabular-nums ${stats.somaCaixaMes >= 0 ? "text-brand-400" : "text-red-400"}`}>
                    {formatBRL(stats.somaCaixaMes)}
                  </span>
                </div>
              </div>
            )}

            {stats.maioresGastos.length > 0 && (
              <div className="pt-2 border-t border-slate-700/50">
                <h3 className="text-slate-300 font-medium mb-3">
                  Maiores gastos do mês
                </h3>
                <ul className="space-y-2">
                  {stats.maioresGastos.map((t) => (
                    <li
                      key={t.id}
                      className="flex justify-between items-center gap-2 text-sm"
                    >
                      <span className="text-slate-300 truncate">{t.descricao}</span>
                      <span className="text-red-400 font-medium shrink-0">
                        {formatBRL(Math.abs(t.valor))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stats.tagHierarchy.length === 0 &&
              stats.topContas.length === 0 &&
              stats.maioresGastos.length === 0 && (
                <div className="pt-2 border-t border-slate-700/50 space-y-2">
                  <p className="text-slate-500 text-sm">
                    Nenhum gasto neste mês.{" "}
                    <Link href="/" className="text-brand-500 hover:underline">
                      Adicione uma transação
                    </Link>
                  </p>
                  {stats.totalTransacoes === 0 && (
                    <button
                      type="button"
                      onClick={loadSampleData}
                      className="text-sm text-brand-400 hover:text-brand-300 underline cursor-pointer"
                    >
                      Carregar dados de exemplo
                    </button>
                  )}
                </div>
              )}
          </div>

          {/* Coluna direita (somente lg/iPad landscape): Gráfico */}
          {stats.tagHierarchy.length > 0 && (
            <div className="hidden lg:block lg:shrink-0 lg:pl-6 ipad:pl-8 ipad:min-w-[260px]">
              <h3 className="text-slate-300 font-medium mb-3 lg:sr-only">Gráfico</h3>
              <DonutChart
                data={stats.tagHierarchy.map((n) => ({
                  label: n.tag.nome,
                  value: n.total,
                  color: n.tag.cor || "#6366f1",
                }))}
                total={stats.gastosFluxo}
                formatValue={formatBRL}
              />
            </div>
          )}
        </div>
      </div>

      {contaSaldoModal && (
        <div
          className="modal-overlay"
          onClick={() => setContaSaldoModal(null)}
        >
          <div
            className="modal-content-centered w-full max-w-md overflow-hidden flex flex-col rounded-xl glass shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between shrink-0 gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-slate-200 truncate">{contaSaldoModal}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{stats.mesLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setContaSaldoModal(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 p-4">
              {saldoInicialContaModal !== 0 && (
                <div className="mb-3 flex justify-between text-sm text-slate-500">
                  <span>Saldo inicial</span>
                  <span className="tabular-nums">{formatBRL(saldoInicialContaModal)}</span>
                </div>
              )}
              {transacoesContaSaldoDetalhe.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  {saldoInicialContaModal !== 0
                    ? "Nenhuma movimentação nesta conta neste mês."
                    : "Nenhuma transação nesta conta para este mês."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {transacoesContaSaldoDetalhe.map((t) => (
                    <li
                      key={t.id}
                      className="flex justify-between items-start gap-2 py-2 border-b border-slate-700/30 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-200 truncate">{t.descricao}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatLocalDate(t.data, { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      <span
                        className={`font-medium shrink-0 ${
                          t.valor >= 0 ? "text-brand-400" : "text-red-400"
                        }`}
                      >
                        {formatBRL(t.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 pt-3 border-t border-slate-700/40 space-y-1.5 text-sm">
                {saldoInicialContaModal !== 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Movimento no mês</span>
                    <span
                      className={`tabular-nums ${
                        movimentoContaModal >= 0 ? "text-brand-400" : "text-red-400"
                      }`}
                    >
                      {formatBRL(movimentoContaModal)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span className="font-medium">
                    {saldoInicialContaModal !== 0 ? "Saldo final" : "Saldo no mês"}
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${
                      saldoFinalContaModal >= 0 ? "text-brand-400" : "text-red-400"
                    }`}
                  >
                    {formatBRL(saldoFinalContaModal)}
                  </span>
                </div>
              </div>
              <Link
                href={`/transacoes?conta=${encodeURIComponent(contaSaldoModal)}&mesEfetivo=${encodeURIComponent(mesSelecionado)}`}
                onClick={() => setContaSaldoModal(null)}
                className="mt-3 block text-center text-sm text-brand-400 hover:text-brand-300"
              >
                Abrir em Transações →
              </Link>
            </div>
          </div>
        </div>
      )}

      {receitasModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setReceitasModalOpen(false)}
        >
          <div
            className="modal-content-centered w-full max-w-md overflow-hidden flex flex-col rounded-xl glass shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between shrink-0 gap-2">
              <h4 className="font-semibold text-slate-200">Receitas do mês</h4>
              <button
                type="button"
                onClick={() => setReceitasModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 p-4">
              {stats.receitas.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhuma receita</p>
              ) : (
                <ul className="space-y-2">
                  {[...stats.receitas]
                    .sort(compareTransacoesDesc)
                    .map((t) => (
                      <li
                        key={t.id}
                        className="flex justify-between items-start gap-2 py-2 border-b border-slate-700/30 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-200 truncate">{t.descricao}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatLocalDate(t.data, { day: "2-digit", month: "short" })} • {t.conta}
                          </p>
                        </div>
                        <span className="text-brand-400 font-medium shrink-0">
                          {formatBRL(t.valor)}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {aportesModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setAportesModalOpen(false)}
        >
          <div
            className="modal-content-centered w-full max-w-md overflow-hidden flex flex-col rounded-xl glass shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between shrink-0 gap-2">
              <h4 className="font-semibold text-slate-200">Aportes do mês</h4>
              <button
                type="button"
                onClick={() => setAportesModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 p-4">
              {stats.investimento.transacoesAporte.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum aporte</p>
              ) : (
                <ul className="space-y-2">
                  {[...stats.investimento.transacoesAporte]
                    .sort(compareTransacoesDesc)
                    .map((t) => {
                      const destino =
                        getContaDestinoTransferencia(t, transacoes) ?? t.contaDestino ?? "—";
                      return (
                        <li
                          key={t.id}
                          className="flex justify-between items-start gap-2 py-2 border-b border-slate-700/30 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-200 truncate">{t.descricao}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatLocalDate(t.data, { day: "2-digit", month: "short" })} •{" "}
                              {t.conta} → {destino}
                            </p>
                          </div>
                          <span className="text-emerald-400 font-medium shrink-0">
                            {formatBRL(Math.abs(t.valor))}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {resgatesModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setResgatesModalOpen(false)}
        >
          <div
            className="modal-content-centered w-full max-w-md overflow-hidden flex flex-col rounded-xl glass shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between shrink-0 gap-2">
              <h4 className="font-semibold text-slate-200">Resgates do mês</h4>
              <button
                type="button"
                onClick={() => setResgatesModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 p-4">
              {stats.investimento.transacoesResgate.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum resgate</p>
              ) : (
                <ul className="space-y-2">
                  {[...stats.investimento.transacoesResgate]
                    .sort(compareTransacoesDesc)
                    .map((t) => {
                      const origem = getContaOrigemTransferencia(t, transacoes);
                      return (
                        <li
                          key={t.id}
                          className="flex justify-between items-start gap-2 py-2 border-b border-slate-700/30 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-slate-200 truncate">{t.descricao}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatLocalDate(t.data, { day: "2-digit", month: "short" })} •{" "}
                              {origem} → {t.conta}
                            </p>
                          </div>
                          <span className="text-sky-400 font-medium shrink-0">
                            {formatBRL(t.valor)}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
