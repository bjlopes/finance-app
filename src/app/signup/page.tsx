"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const { isConfigured } = useAuth();

  if (!isConfigured) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Criar conta</h1>
        <div className="glass rounded-xl p-6 text-slate-400">
          <p>
            O armazenamento em nuvem não está configurado. Configure o Supabase
            primeiro.
          </p>
        </div>
        <p className="text-center">
          <Link href="/" className="text-brand-400 hover:underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Criar conta</h1>
      <div className="glass rounded-xl p-6 space-y-4">
        <p className="text-slate-300">
          Não é necessário criar conta separadamente. Use apenas seu e-mail para
          entrar.
        </p>
        <p className="text-slate-400 text-sm">
          Na primeira vez que você entrar com um e-mail, a conta será criada
          automaticamente.
        </p>
        <Link
          href="/login"
          className="block w-full px-4 py-2 rounded-lg bg-brand-500 text-white font-medium text-center hover:bg-brand-600 transition-colors"
        >
          Ir para o login
        </Link>
      </div>
      <p className="text-center">
        <Link href="/" className="text-slate-500 hover:text-slate-400 text-sm">
          Voltar ao início
        </Link>
      </p>
    </div>
  );
}
