"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Wallet, ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";
import { getMesEfetivo } from "@/lib/fluxoCaixa";

export default function RelatoriosPage() {
  const { transacoes, tags, contas, loading } = useData();
  const [contaSelecionada, setContaSelecionada] = useState<string | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [contaDetalheMes, setContaDetalheMes] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fluxoMensal = useMemo(() => {
    const mesesMap = new Map<string, { receitas: number; despesas: number }>();
    transacoes.forEach((t) => {
      const mesKey = getMesEfetivo(t, contas);
      const atual = mesesMap.get(mesKey) ?? { receitas: 0, despesas: 0 };
      if (t.valor > 0) atual.receitas += t.valor;
      else atual.despesas += Math.abs(t.valor);
      mesesMap.set(mesKey, atual);
    });
    return Array.from(mesesMap.entries())
      .map(([mes, { receitas, despesas }]) => ({ mes, receitas, despesas }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(0, 12);
  }, [transacoes, contas]);

  const stats = useMemo(() => {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let totalGastos = 0;
    let totalReceitas = 0;
    const porConta: Record<string, number> = {};

    transacoes.forEach((t) => {
      const mesEfetivo = getMesEfetivo(t, contas);
      if (mesEfetivo !== mesAtual) return;
      if (t.valor < 0) {
        totalGastos += Math.abs(t.valor);
        porConta[t.conta] = (porConta[t.conta] || 0) + Math.abs(t.valor);
      } else {
        totalReceitas += t.valor;
      }
    });

    const gastosPorConta = Object.entries(porConta)
      .sort(([, a], [, b]) => b - a)
      .map(([conta, valor]) => ({ conta, valor }));

    return {
      totalGastosMes: totalGastos,
      totalReceitasMes: totalReceitas,
      saldoMes: totalReceitas - totalGastos,
      gastosPorConta,
    };
  }, [transacoes, contas]);

  const formatBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatMes = (mesKey: string) => {
    const [y, m] = mesKey.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
  };

  const transacoesPorConta = useMemo(() => {
    if (!contaSelecionada) return [];
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return transacoes
      .filter(
        (t) =>
          t.conta === contaSelecionada && getMesEfetivo(t, contas) === mesAtual
      )
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transacoes, contaSelecionada, contas]);

  const detalheMes = useMemo(() => {
    if (!mesSelecionado) return null;
    const receitas = transacoes
      .filter(
        (t) => getMesEfetivo(t, contas) === mesSelecionado && t.valor > 0
      )
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    const despesas = transacoes
      .filter(
        (t) => getMesEfetivo(t, contas) === mesSelecionado && t.valor < 0
      )
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    const porConta: Record<string, number> = {};
    despesas.forEach((t) => {
      porConta[t.conta] = (porConta[t.conta] || 0) + Math.abs(t.valor);
    });
    const despesasPorConta = Object.entries(porConta)
      .sort(([, a], [, b]) => b - a)
      .map(([conta, valor]) => ({ conta, valor }));
    return { receitas, despesas, despesasPorConta };
  }, [transacoes, contas, mesSelecionado]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Relatórios</h1>
        <p className="text-slate-400 mt-1">
          Fluxo de caixa mensal (cartão de crédito no mês do vencimento da fatura)
        </p>
      </div>

      <div className="glass rounded-xl p-6 overflow-x-auto">
        <h2 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
          <TrendingUp size={22} />
          Fluxo de caixa mensal
        </h2>
        {fluxoMensal.length > 0 ? (
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                <th className="pb-3 font-medium">Mês</th>
                <th className="pb-3 font-medium text-right">Receitas</th>
                <th className="pb-3 font-medium text-right">Despesas</th>
                <th className="pb-3 font-medium text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {fluxoMensal.map(({ mes, receitas, despesas }) => {
                const saldo = receitas - despesas;
                return (
                  <tr
                    key={mes}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setMesSelecionado(mesSelecionado === mes ? null : mes);
                      setContaDetalheMes(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setMesSelecionado(mesSelecionado === mes ? null : mes);
                        setContaDetalheMes(null);
                      }
                    }}
                    className={`border-b border-slate-700/50 last:border-0 hover:bg-slate-800/30 transition-colors cursor-pointer ${
                      mesSelecionado === mes ? "bg-slate-800/50" : ""
                    }`}
                  >
                    <td className="py-3 text-slate-200 font-medium capitalize">
                      {formatMes(mes)}
                    </td>
                    <td className="py-3 text-right text-brand-400">
                      {formatBRL(receitas)}
                    </td>
                    <td className="py-3 text-right text-red-400">
                      {formatBRL(despesas)}
                    </td>
                    <td
                      className={`py-3 text-right font-semibold ${
                        saldo >= 0 ? "text-brand-400" : "text-red-400"
                      }`}
                    >
                      {formatBRL(saldo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500 text-sm">
            Nenhum dado para exibir. Adicione transações.
          </p>
        )}
      </div>

      {mesSelecionado && detalheMes && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMesSelecionado(null);
                setContaDetalheMes(null);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors cursor-pointer"
              title="Fechar"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-slate-200 capitalize">
              Detalhamento de {formatMes(mesSelecionado)}
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0 overflow-hidden">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-brand-400 mb-3 flex items-center gap-2">
                Receitas ({formatBRL(detalheMes.receitas.reduce((s, t) => s + t.valor, 0))})
              </h3>
              {detalheMes.receitas.length > 0 ? (
                <ul className="divide-y divide-slate-700/50 max-h-[300px] overflow-y-auto">
                  {detalheMes.receitas.map((t) => {
                    const transacaoTags = tags.filter((tg) => t.tagIds.includes(tg.id));
                    const isExpanded = expandedId === t.id;
                    const temComentario = !!t.comentario?.trim();
                    return (
                      <li key={t.id} className={temComentario ? "cursor-pointer" : ""}>
                        <div
                          role={temComentario ? "button" : undefined}
                          tabIndex={temComentario ? 0 : undefined}
                          onClick={() =>
                            temComentario && setExpandedId(isExpanded ? null : t.id)
                          }
                          onKeyDown={(e) =>
                            temComentario &&
                            (e.key === "Enter" || e.key === " ") &&
                            (e.preventDefault(), setExpandedId(isExpanded ? null : t.id))
                          }
                          className="flex items-center justify-between gap-4 py-3 first:pt-0 hover:bg-slate-800/30"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-200 truncate">{t.descricao}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-slate-500">
                                  {formatDate(t.data)} • {t.conta}
                                </span>
                                {transacaoTags.map((tg) => (
                                  <span
                                    key={tg.id}
                                    className="text-xs px-2 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: `${tg.cor}25`,
                                      color: tg.cor,
                                    }}
                                  >
                                    {tg.nome}
                                  </span>
                                ))}
                              </div>
                          </div>
                          <span className="font-semibold text-brand-400 flex-shrink-0">
                            {formatBRL(t.valor)}
                          </span>
                        </div>
                        {isExpanded && t.comentario?.trim() && (
                          <div className="pb-3">
                            <p className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                              {t.comentario}
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm py-4">
                  Nenhuma receita neste mês.
                </p>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-red-400 mb-3">
                Despesas por conta ({formatBRL(detalheMes.despesas.reduce((s, t) => s + Math.abs(t.valor), 0))})
              </h3>
              {contaDetalheMes ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setContaDetalheMes(null)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-3 cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    Voltar
                  </button>
                  <ul className="divide-y divide-slate-700/50 max-h-[300px] overflow-y-auto">
                    {detalheMes.despesas
                      .filter((t) => t.conta === contaDetalheMes)
                      .map((t) => {
                        const transacaoTags = tags.filter((tg) => t.tagIds.includes(tg.id));
                        const isExpanded = expandedId === t.id;
                        const temComentario = !!t.comentario?.trim();
                        return (
                          <li key={t.id} className={temComentario ? "cursor-pointer" : ""}>
                            <div
                              role={temComentario ? "button" : undefined}
                              tabIndex={temComentario ? 0 : undefined}
                              onClick={() =>
                                temComentario && setExpandedId(isExpanded ? null : t.id)
                              }
                              onKeyDown={(e) =>
                                temComentario &&
                                (e.key === "Enter" || e.key === " ") &&
                                (e.preventDefault(), setExpandedId(isExpanded ? null : t.id))
                              }
                              className="flex items-center justify-between gap-4 py-3 first:pt-0 hover:bg-slate-800/30"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-200 truncate">{t.descricao}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs text-slate-500">{formatDate(t.data)}</span>
                                    {transacaoTags.map((tg) => (
                                      <span
                                        key={tg.id}
                                        className="text-xs px-2 py-0.5 rounded-full"
                                        style={{
                                          backgroundColor: `${tg.cor}25`,
                                          color: tg.cor,
                                        }}
                                      >
                                        {tg.nome}
                                      </span>
                                    ))}
                                  </div>
                              </div>
                              <span className="font-semibold text-red-400 flex-shrink-0">
                                {formatBRL(Math.abs(t.valor))}
                              </span>
                            </div>
                            {isExpanded && t.comentario?.trim() && (
                              <div className="pb-3">
                                <p className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
                                  {t.comentario}
                                </p>
                              </div>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ) : detalheMes.despesasPorConta.length > 0 ? (
                <ul className="divide-y divide-slate-700/50">
                  {detalheMes.despesasPorConta.map(({ conta, valor }) => (
                    <li key={conta}>
                      <button
                        type="button"
                        onClick={() => setContaDetalheMes(conta)}
                        className="w-full flex items-center justify-between gap-4 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer text-left"
                      >
                        <span className="font-medium text-slate-200 truncate">{conta}</span>
                        <span className="font-semibold text-red-400 flex-shrink-0">
                          {formatBRL(valor)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm py-4">
                  Nenhuma despesa neste mês.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-slate-500 text-sm">Gastos totais</p>
          <p className="text-xl font-bold text-red-400 mt-1">
            {formatBRL(stats.totalGastosMes)}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-slate-500 text-sm">Receitas totais</p>
          <p className="text-xl font-bold text-brand-400 mt-1">
            {formatBRL(stats.totalReceitasMes)}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-slate-500 text-sm">Saldo</p>
          <p
            className={`text-xl font-bold mt-1 ${
              stats.saldoMes >= 0 ? "text-brand-400" : "text-red-400"
            }`}
          >
            {formatBRL(stats.saldoMes)}
          </p>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
          {contaSelecionada ? (
            <>
              <button
                type="button"
                onClick={() => setContaSelecionada(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors cursor-pointer"
                title="Voltar"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Wallet size={22} />
                Transações em {contaSelecionada}
              </h2>
            </>
          ) : (
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Wallet size={22} />
              Gastos por conta
            </h2>
          )}
        </div>
        <div className="p-6">
          {contaSelecionada ? (
            transacoesPorConta.length > 0 ? (
              <ul className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
                {transacoesPorConta.map((t) => {
                  const transacaoTags = tags.filter((tg) => t.tagIds.includes(tg.id));
                  const isExpanded = expandedId === t.id;
                  const temComentario = !!t.comentario?.trim();
                  return (
                    <li key={t.id} className={temComentario ? "cursor-pointer" : ""}>
                      <div
                        role={temComentario ? "button" : undefined}
                        tabIndex={temComentario ? 0 : undefined}
                        onClick={() =>
                          temComentario && setExpandedId(isExpanded ? null : t.id)
                        }
                        onKeyDown={(e) =>
                          temComentario &&
                          (e.key === "Enter" || e.key === " ") &&
                          (e.preventDefault(), setExpandedId(isExpanded ? null : t.id))
                        }
                        className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:bg-slate-800/30"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-200 truncate">{t.descricao}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-slate-500">{formatDate(t.data)}</span>
                              {transacaoTags.map((tg) => (
                                <span
                                  key={tg.id}
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `${tg.cor}25`,
                                    color: tg.cor,
                                  }}
                                >
                                  {tg.nome}
                                </span>
                              ))}
                            </div>
                        </div>
                        <span
                          className={`font-semibold flex-shrink-0 ${
                            t.valor >= 0 ? "text-brand-400" : "text-red-400"
                          }`}
                        >
                          {formatBRL(t.valor)}
                        </span>
                      </div>
                      {isExpanded && t.comentario?.trim() && (
                        <div className="pb-4">
                          <p className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            {t.comentario}
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">
                Nenhuma transação nesta conta.
              </p>
            )
          ) : stats.gastosPorConta.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.gastosPorConta.map(({ conta, valor }) => (
                <button
                  type="button"
                  key={conta}
                  onClick={() => setContaSelecionada(conta)}
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-brand-500/50 hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <p className="text-slate-400 text-sm">{conta}</p>
                  <p className="text-xl font-bold text-red-400 mt-1">
                    {formatBRL(valor)}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">
              Nenhum gasto neste mês.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
