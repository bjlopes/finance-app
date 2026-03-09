"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { getMesEfetivo } from "@/lib/fluxoCaixa";

export default function DashboardPage() {
  const { transacoes, tags, contas, loading, loadSampleData } = useData();

  const stats = useMemo(() => {
    const now = new Date();
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const transacoesMes = transacoes.filter(
      (t) => getMesEfetivo(t, contas) === mesAtual
    );

    const totalGastos = transacoesMes
      .filter((t) => t.valor < 0)
      .reduce((sum, t) => sum + t.valor, 0);

    const totalReceitas = transacoesMes
      .filter((t) => t.valor > 0)
      .reduce((sum, t) => sum + t.valor, 0);

    const porTag: Record<string, number> = {};
    transacoesMes
      .filter((t) => t.valor < 0)
      .forEach((t) => {
        t.tagIds.forEach((tagId) => {
          const tag = tags.find((tg) => tg.id === tagId);
          const nome = tag?.nome || "sem tag";
          porTag[nome] = (porTag[nome] || 0) + Math.abs(t.valor);
        });
      });

    const topTags = Object.entries(porTag)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nome, valor]) => ({ nome, valor }));

    return {
      totalGastosMes: Math.abs(totalGastos),
      totalReceitasMes: totalReceitas,
      saldoMes: totalReceitas + totalGastos,
      topTags,
      totalTransacoes: transacoes.length,
    };
  }, [transacoes, tags, contas]);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">Visão geral do mês</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <TrendingDown size={18} />
            Gastos do mês
          </div>
          <p className="text-xl font-bold text-red-400">
            {formatBRL(stats.totalGastosMes)}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <TrendingUp size={18} />
            Receitas do mês
          </div>
          <p className="text-xl font-bold text-brand-400">
            {formatBRL(stats.totalReceitasMes)}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Wallet size={18} />
            Saldo do mês
          </div>
          <p
            className={`text-xl font-bold ${
              stats.saldoMes >= 0 ? "text-brand-400" : "text-red-400"
            }`}
          >
            {formatBRL(stats.saldoMes)}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Receipt size={18} />
            Total de transações
          </div>
          <p className="text-xl font-bold text-slate-200">
            {stats.totalTransacoes}
          </p>
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Top 5 gastos por tag
        </h2>
        {stats.topTags.length > 0 ? (
          <div className="space-y-3">
            {stats.topTags.map((t, i) => (
              <div key={t.nome} className="flex items-center gap-4">
                <span className="text-slate-500 w-6">{i + 1}.</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 capitalize">{t.nome}</span>
                    <span className="text-slate-200 font-medium">
                      {formatBRL(t.valor)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-500/70"
                      style={{
                        width: `${
                          (t.valor / (stats.topTags[0]?.valor ?? 1)) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-slate-500 text-sm">
              Nenhum gasto com tags neste mês.{" "}
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
  );
}
