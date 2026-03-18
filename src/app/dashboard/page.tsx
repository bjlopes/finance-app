"use client";

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { buildTagSpendingHierarchy } from "@/lib/tags-utils";
import { GastosPorTagHierarquico } from "@/components/GastosPorTagHierarquico";
import { DonutChart } from "@/components/DonutChart";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { getMesEfetivo } from "@/lib/fluxoCaixa";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function DashboardPage() {
  const { transacoes, tags, contas, loading, loadSampleData } = useData();

  const now = new Date();
  const mesAtualPadrao = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [mesSelecionado, setMesSelecionado] = useState(mesAtualPadrao);

  const stats = useMemo(() => {
    const transacoesMes = transacoes.filter(
      (t) => getMesEfetivo(t, contas) === mesSelecionado
    );

    const gastos = transacoesMes.filter((t) => t.valor < 0);
    const receitas = transacoesMes.filter((t) => t.valor > 0);
    const totalGastos = gastos.reduce((sum, t) => sum + Math.abs(t.valor), 0);
    const totalReceitas = receitas.reduce((sum, t) => sum + t.valor, 0);
    const saldo = totalReceitas - totalGastos;

    const gastosPorTagId: Record<string, number> = {};
    gastos.forEach((t) => {
      t.tagIds.forEach((tagId) => {
        gastosPorTagId[tagId] = (gastosPorTagId[tagId] || 0) + Math.abs(t.valor);
      });
    });

    const tagHierarchy = buildTagSpendingHierarchy(tags, gastosPorTagId);

    const porConta: Record<string, number> = {};
    gastos.forEach((t) => {
      porConta[t.conta] = (porConta[t.conta] || 0) + Math.abs(t.valor);
    });

    const topContas = Object.entries(porConta)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const maioresGastos = [...gastos]
      .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
      .slice(0, 5);

    const [ano, mes] = mesSelecionado.split("-").map(Number);
    return {
      mesLabel: `${MESES[mes - 1]} ${ano}`,
      totalGastosMes: totalGastos,
      totalReceitasMes: totalReceitas,
      saldoMes: saldo,
      tagHierarchy,
      gastos,
      topContas,
      maioresGastos,
      qtdTransacoesMes: transacoesMes.length,
      qtdGastos: gastos.length,
      qtdReceitas: receitas.length,
      totalTransacoes: transacoes.length,
    };
  }, [transacoes, tags, contas, mesSelecionado]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-1">{stats.mesLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <input
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 min-h-[44px]"
          />
          <button
            type="button"
            onClick={() => mudarMes(1)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            aria-label="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start space-y-6 lg:space-y-0">
          {/* Coluna esquerda: Fluxo do mês */}
          <div className="space-y-6 lg:pr-4 lg:border-r lg:border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-200 border-b border-slate-700/50 pb-3">
              Fluxo do mês
            </h2>

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
              <div>
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
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-y border-slate-700/50">
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

            <div className="flex items-center justify-between text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <Receipt size={16} />
                Total no mês
              </span>
              <span>{stats.qtdTransacoesMes} transações</span>
            </div>
          </div>

          {/* Coluna direita: Gastos por tag, conta, maiores */}
          <div className="space-y-6 lg:pl-4">
        {stats.tagHierarchy.length > 0 && (
          <div className="pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-700/50">
            <h3 className="flex items-center gap-2 text-slate-300 font-medium mb-3">
              <Tag size={16} />
              Gastos por tag
            </h3>
            <div className="mb-4">
              <DonutChart
                data={stats.tagHierarchy.map((n) => ({
                  label: n.tag.nome,
                  value: n.total,
                  color: n.tag.cor || "#6366f1",
                }))}
                total={stats.totalGastosMes}
                formatValue={formatBRL}
              />
            </div>
            <GastosPorTagHierarquico
              nodes={stats.tagHierarchy}
              totalGastos={stats.totalGastosMes}
              formatBRL={formatBRL}
              gastos={stats.gastos}
              tags={tags}
            />
          </div>
        )}

        {stats.topContas.length > 0 && (
          <div className="pt-2 border-t border-slate-700/50">
            <h3 className="text-slate-300 font-medium mb-3">Gastos por conta</h3>
            <ul className="space-y-2">
              {stats.topContas.map(([conta, valor]) => (
                <li
                  key={conta}
                  className="flex justify-between text-sm text-slate-400"
                >
                  <span>{conta}</span>
                  <span className="text-slate-200 font-medium">
                    {formatBRL(valor)}
                  </span>
                </li>
              ))}
            </ul>
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
            <div className="pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-700/50 space-y-2">
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
        </div>
      </div>
    </div>
  );
}
