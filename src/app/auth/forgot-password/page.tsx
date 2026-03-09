"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const { resetPasswordForEmail, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSent(false);
    const { error } = await resetPasswordForEmail(email);
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
        <h1 className="text-2xl font-bold text-slate-100">Recuperar senha</h1>
        <div className="glass rounded-xl p-6 text-slate-400">
          <p>O armazenamento em nuvem não está configurado.</p>
        </div>
        <p className="text-center">
          <Link href="/login" className="text-brand-400 hover:underline">
            Voltar ao login
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
            Enviamos um link para <strong>{email}</strong> para redefinir sua senha.
          </p>
          <p className="text-slate-400 text-sm">
            Clique no link recebido e defina uma nova senha. Se não aparecer na
            caixa de entrada, verifique a pasta de spam.
          </p>
          <Link
            href="/login"
            className="block w-full px-4 py-2 rounded-lg bg-brand-500 text-white font-medium text-center hover:bg-brand-600 transition-colors"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Recuperar senha</h1>
      <form
        onSubmit={handleSubmit}
        className="glass rounded-xl p-6 space-y-4"
      >
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
            {error}
          </p>
        )}
        <p className="text-slate-400 text-sm">
          Digite seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
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
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>
      <p className="text-center">
        <Link href="/login" className="text-slate-500 hover:text-slate-400 text-sm">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
