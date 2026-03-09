"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, isConfigured } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-slate-500">Carregando...</div>
      </div>
    );
  }

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/auth/callback";

  if (isConfigured && !user && !isAuthPage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">
          Finanças
        </h1>
        <p className="text-slate-400 text-center mb-8 max-w-sm">
          Controle suas finanças com tags. Entre na sua conta para acessar seus dados.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/login"
            className="flex-1 min-h-[48px] flex items-center justify-center px-4 py-3 rounded-xl bg-brand-500 text-white font-medium text-center hover:bg-brand-600 transition-colors active:scale-[0.98]"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="flex-1 min-h-[48px] flex items-center justify-center px-4 py-3 rounded-xl bg-slate-700 text-slate-200 font-medium text-center hover:bg-slate-600 transition-colors border border-slate-600 active:scale-[0.98]"
          >
            Criar conta
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
