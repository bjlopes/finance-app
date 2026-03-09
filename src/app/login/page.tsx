"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const DEFAULT_EMAIL = "bjlopes@icloud.com";

export default function LoginPage() {
  const { signInWithEmail, isConfigured } = useAuth();
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSent(false);
    const { error } = await signInWithEmail(email);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
  };

  if (!isConfigured) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Entrar</h1>
        <div className="glass rounded-xl p-6 text-slate-400">
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

  if (sent) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Verifique seu e-mail</h1>
        <div className="glass rounded-xl p-6 space-y-4">
          <p className="text-slate-300">
            Enviamos um link de acesso para <strong>{email}</strong>.
          </p>
          <p className="text-slate-400 text-sm">
            Clique no link recebido para entrar. Se não aparecer na caixa de
            entrada, verifique a pasta de spam.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-brand-400 hover:underline text-sm"
          >
            Usar outro e-mail
          </button>
        </div>
        <p className="text-center">
          <Link href="/" className="text-slate-500 hover:text-slate-400 text-sm">
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
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <p className="text-xs text-slate-500 mt-1">
            Enviaremos um link de acesso para seu e-mail (sem senha).
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Enviando link..." : "Enviar link de acesso"}
        </button>
      </form>
      <p className="text-center">
        <Link href="/" className="text-slate-500 hover:text-slate-400 text-sm">
          Voltar ao início
        </Link>
      </p>
    </div>
  );
}
