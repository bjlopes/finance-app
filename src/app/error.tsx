"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na aplicação:", error);
  }, [error]);

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-semibold text-slate-200">
        Algo deu errado
      </h2>
      <p className="text-slate-400 text-center max-w-md">
        Ocorreu um erro. Tente recarregar a página ou voltar ao início.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 font-medium hover:bg-slate-600 transition-colors"
        >
          Ir para início
        </Link>
      </div>
    </div>
  );
}
