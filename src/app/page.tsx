"use client";

import Link from "next/link";
import { TransactionForm } from "@/components/TransactionForm";
import { useData } from "@/context/DataContext";

export default function HomePage() {
  const { loading } = useData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <TransactionForm />
      <p className="text-center">
        <Link
          href="/transacoes"
          className="text-sm text-slate-500 hover:text-brand-400 transition-colors"
        >
          Ver todas as transações →
        </Link>
      </p>
    </div>
  );
}
