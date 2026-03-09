"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalGastosMes: number;
  totalReceitasMes: number;
  saldoMes: number;
  topTags: { nome: string; valor: number }[];
  totalTransacoes: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500">Carregando...</div>
      </div>
    );
  }

  const formatBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);

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
            {formatBRL(stats?.totalGastosMes ?? 0)}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <TrendingUp size={18} />
            Receitas do mês
          </div>
          <p className="text-xl font-bold text-brand-400">
            {formatBRL(stats?.totalReceitasMes ?? 0)}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Wallet size={18} />
            Saldo do mês
          </div>
          <p
            className={`text-xl font-bold ${
              (stats?.saldoMes ?? 0) >= 0 ? "text-brand-400" : "text-red-400"
            }`}
          >
            {formatBRL(stats?.saldoMes ?? 0)}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Receipt size={18} />
            Total de transações
          </div>
          <p className="text-xl font-bold text-slate-200">
            {stats?.totalTransacoes ?? 0}
          </p>
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Top 5 gastos por tag
        </h2>
        {stats?.topTags && stats.topTags.length > 0 ? (
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
                          (t.valor /
                            (stats.topTags[0]?.valor ?? 1)) *
                          100
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
              <Link href="/transacoes" className="text-brand-500 hover:underline">
                Adicione transações
              </Link>
            </p>
            {(stats?.totalTransacoes ?? 0) === 0 && (
              <button
                onClick={() =>
                  fetch("/api/seed", { method: "POST" })
                    .then((r) => r.json())
                    .then(() => window.location.reload())
                }
                className="text-sm text-brand-400 hover:text-brand-300 underline"
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
