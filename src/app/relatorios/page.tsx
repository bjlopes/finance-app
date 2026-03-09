"use client";

import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";

interface Stats {
  totalGastosMes: number;
  totalReceitasMes: number;
  saldoMes: number;
  topTags: { nome: string; valor: number }[];
}

export default function RelatoriosPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

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

  const maxVal = Math.max(...(stats?.topTags?.map((t) => t.valor) ?? [1]), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Relatórios</h1>
        <p className="text-slate-400 mt-1">
          Análise de gastos por tag no mês
        </p>
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
          <BarChart3 size={22} />
          Distribuição por tag
        </h2>
        {stats?.topTags && stats.topTags.length > 0 ? (
          <div className="space-y-4">
            {stats.topTags.map((t) => (
              <div key={t.nome} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300 capitalize">{t.nome}</span>
                  <span className="text-slate-200 font-medium">
                    {formatBRL(t.valor)}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                    style={{ width: `${(t.valor / maxVal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">
            Nenhum dado para exibir. Adicione transações com tags.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-slate-500 text-sm">Gastos totais</p>
          <p className="text-xl font-bold text-red-400 mt-1">
            {formatBRL(stats?.totalGastosMes ?? 0)}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-slate-500 text-sm">Receitas totais</p>
          <p className="text-xl font-bold text-brand-400 mt-1">
            {formatBRL(stats?.totalReceitasMes ?? 0)}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-slate-500 text-sm">Saldo</p>
          <p
            className={`text-xl font-bold mt-1 ${
              (stats?.saldoMes ?? 0) >= 0 ? "text-brand-400" : "text-red-400"
            }`}
          >
            {formatBRL(stats?.saldoMes ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
