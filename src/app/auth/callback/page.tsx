"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );

  useEffect(() => {
    if (loading) return;
    if (user) {
      setStatus("success");
      router.replace("/");
    } else {
      setStatus("error");
      setTimeout(() => router.replace("/login"), 2000);
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-[40vh]">
      {status === "processing" && (
        <p className="text-slate-400 animate-pulse">Entrando...</p>
      )}
      {status === "success" && (
        <p className="text-brand-400">Login realizado! Redirecionando...</p>
      )}
      {status === "error" && (
        <p className="text-slate-400">
          Link inválido ou expirado. Redirecionando para o login...
        </p>
      )}
    </div>
  );
}
