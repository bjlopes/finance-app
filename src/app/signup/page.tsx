"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const { signUpWithPassword, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signUpWithPassword(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
  };

  if (!isConfigured) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Criar conta</h1>
        <div className="glass rounded-xl p-6 space-y-4 text-slate-400">
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

  if (success) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Conta criada</h1>
        <div className="glass rounded-xl p-6 space-y-4">
          <p className="text-slate-300">
            Sua conta foi criada com sucesso. Você já pode entrar.
          </p>
          <Link
            href="/login"
            className="block w-full px-4 py-2 rounded-lg bg-brand-500 text-white font-medium text-center hover:bg-brand-600 transition-colors"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Criar conta</h1>
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
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            minLength={6}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-brand-400 hover:underline">
          Entrar
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
