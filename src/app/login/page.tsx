"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signInWithPassword(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      router.replace("/");
    }
  };

  if (!isConfigured) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Entrar</h1>
        <div className="glass rounded-xl p-6 space-y-4 text-slate-400">
          <p className="mb-4">
            O armazenamento em nuvem não está configurado. Configure as variáveis
            de ambiente do Supabase para habilitar login e sincronização.
          </p>
          <p className="text-sm text-slate-500">
            Veja o arquivo{" "}
            <code className="bg-slate-800 px-1 rounded">.env.example</code> para
            instruções.
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
      <h1 className="text-2xl font-bold text-slate-100">Entrar</h1>
      <form
        onSubmit={handleSubmit}
        className="glass rounded-xl p-6 space-y-4"
      >
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
            {error}
          </p>
        )}
        <div>
          <label className="block text-sm text-slate-400 mb-1">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            autoComplete="email"
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            autoComplete="current-password"
            minLength={6}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="text-center">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-slate-500 hover:text-brand-400"
          >
            Esqueci a senha
          </Link>
        </p>
      </form>
      <p className="text-center text-sm text-slate-500">
        Não tem conta?{" "}
        <Link href="/signup" className="text-brand-400 hover:underline">
          Criar conta
        </Link>
      </p>
      <p className="text-center">
        <Link href="/" className="text-slate-500 hover:text-slate-400 text-sm">
          Voltar ao início
        </Link>
      </p>
    </div>
  );
}
