"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { user, updatePassword, loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const hasAuthParams =
      typeof window !== "undefined" &&
      (window.location.hash?.includes("access_token") ||
        window.location.hash?.includes("type=recovery") ||
        window.location.search?.includes("code="));
    if (!user && !hasAuthParams) {
      router.replace("/auth/forgot-password");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setTimeout(() => { window.location.href = "/"; }, 1500);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[40vh]">
        <p className="text-slate-400 animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Senha atualizada</h1>
        <div className="glass rounded-xl p-6">
          <p className="text-slate-300">
            Sua senha foi alterada com sucesso. Redirecionando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Nova senha</h1>
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
          Defina uma nova senha para sua conta.
        </p>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Nova senha</label>
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
        <div>
          <label className="block text-sm text-slate-400 mb-1">Confirmar senha</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Repita a senha"
            autoComplete="new-password"
            minLength={6}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[48px] px-4 py-3 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Salvando..." : "Salvar senha"}
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
