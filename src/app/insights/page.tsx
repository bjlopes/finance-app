"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { calcularInsightsFinanceiros } from "@/lib/insights";

function mesAtual(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

function mudarMesYm(mesYm: string, delta: number): string {
  const [ano, mes] = mesYm.split("-").map(Number);
  const d = new Date(ano, mes - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const formatBRL = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor);

export default function InsightsPage() {
  const { transacoes, tags, contas, loading } = useData();
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);

  const insights = useMemo(
    () =>
      calcularInsightsFinanceiros(
        transacoes,
        tags,
        contas,
        mesSelecionado
      ),
    [transacoes, tags, contas, mesSelecionado]
  );

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Carregando insights...
      </div>
    );
  }

  const temBase = insights.mesesBase.length > 0 && insights.custoVidaTipico > 0;
  const deltaAtual =
    insights.custoVidaTipico > 0
      ? ((insights.gastoAtual - insights.custoVidaTipico) /
          insights.custoVidaTipico) *
        100
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="text-brand-400" size={24} />
            <h1 className="text-2xl font-bold text-slate-100">Insights</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Estimativas explicáveis — sem misturar investimentos e transferências
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMesSelecionado((mes) => mudarMesYm(mes, -1))}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <input
            type="month"
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="min-h-[44px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <button
            type="button"
            onClick={() => setMesSelecionado((mes) => mudarMesYm(mes, 1))}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            aria-label="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {!temBase ? (
        <div className="glass rounded-xl p-6 text-center">
          <Sparkles className="mx-auto mb-3 text-slate-500" size={28} />
          <h2 className="font-semibold text-slate-200">Ainda faltam dados</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Os insights aparecem quando houver gastos de custo de vida no mês ou
            em meses anteriores.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Brain size={17} />
                Custo de vida típico
              </div>
              <p className="mt-2 text-2xl font-bold text-brand-400">
                {formatBRL(insights.custoVidaTipico)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Faixa normal: {formatBRL(insights.faixaBaixa)}–{formatBRL(insights.faixaAlta)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Confiança {insights.confianca} · {insights.mesesBase.length}{" "}
                {insights.mesesBase.length === 1 ? "mês analisado" : "meses analisados"}
              </p>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                {deltaAtual != null && deltaAtual > 0 ? (
                  <TrendingUp size={17} className="text-red-400" />
                ) : (
                  <TrendingDown size={17} className="text-brand-400" />
                )}
                Gasto no mês
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-100">
                {formatBRL(insights.gastoAtual)}
              </p>
              {deltaAtual != null && (
                <p
                  className={`mt-1 text-xs ${
                    deltaAtual > 15
                      ? "text-red-400"
                      : deltaAtual < -15
                        ? "text-brand-400"
                        : "text-slate-500"
                  }`}
                >
                  {deltaAtual >= 0 ? "+" : ""}
                  {Math.round(deltaAtual)}% vs. típico
                </p>
              )}
            </div>

            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <PiggyBank size={17} />
                Folga típica
              </div>
              <p
                className={`mt-2 text-2xl font-bold ${
                  insights.sobraTipica >= 0 ? "text-sky-400" : "text-red-400"
                }`}
              >
                {formatBRL(insights.sobraTipica)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Receita típica {formatBRL(insights.receitaTipica)}
                {insights.taxaPoupancaTipica != null &&
                  ` · ${Math.round(insights.taxaPoupancaTipica)}% de folga`}
              </p>
            </div>
          </div>

          {insights.mensagens.length > 0 && (
            <section className="glass rounded-xl p-5">
              <h2 className="flex items-center gap-2 font-semibold text-slate-200">
                <Sparkles size={18} className="text-amber-400" />
                Leitura do mês
              </h2>
              <ul className="mt-3 space-y-2">
                {insights.mensagens.map((mensagem) => (
                  <li
                    key={mensagem}
                    className="flex gap-2 text-sm leading-relaxed text-slate-300"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    {mensagem}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="glass rounded-xl p-5">
              <h2 className="font-semibold text-slate-200">Categorias</h2>
              <p className="mt-1 text-xs text-slate-500">
                Mediana histórica sem gastos identificados como pontuais
              </p>
              <div className="mt-4 space-y-3">
                {insights.categorias.map((categoria) => (
                  <div key={categoria.nome}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-slate-300">{categoria.nome}</span>
                      <span className="shrink-0 text-slate-400">
                        {formatBRL(categoria.atual)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span>Típico {formatBRL(categoria.tipico)}</span>
                      {categoria.diferencaPercentual != null && (
                        <span
                          className={
                            categoria.diferencaPercentual > 25
                              ? "text-red-400"
                              : categoria.diferencaPercentual < -25
                                ? "text-brand-400"
                                : ""
                          }
                        >
                          {categoria.diferencaPercentual >= 0 ? "+" : ""}
                          {Math.round(categoria.diferencaPercentual)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass rounded-xl p-5">
              <h2 className="flex items-center gap-2 font-semibold text-slate-200">
                <AlertTriangle size={18} className="text-amber-400" />
                Pontuais e outliers
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Excluídos da estimativa típica; continuam no gasto real do mês
              </p>
              {insights.pontuaisDoMes.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  Nenhum gasto pontual relevante detectado neste mês.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {insights.pontuaisDoMes.map((item) => (
                    <li
                      key={item.id}
                      className="border-b border-slate-700/30 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-200">
                            {item.descricao}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.categoria} · {item.motivo}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-amber-400">
                          {formatBRL(item.valor)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {insights.pontuaisExcluidos.length > 0 && (
                <p className="mt-4 border-t border-slate-700/40 pt-3 text-xs text-slate-500">
                  A base histórica removeu {insights.pontuaisExcluidos.length}{" "}
                  {insights.pontuaisExcluidos.length === 1
                    ? "lançamento atípico"
                    : "lançamentos atípicos"}.
                </p>
              )}
            </section>
          </div>

          <p className="text-center text-xs text-slate-600">
            Método: mediana dos últimos 6 meses com dados, removendo investimentos,
            transferências internas e valores pontuais. Revise as tags “pontual” e
            “recorrente” para melhorar a precisão.
          </p>
        </>
      )}
    </div>
  );
}
