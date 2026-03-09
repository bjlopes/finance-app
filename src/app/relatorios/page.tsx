"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RelatoriosPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-pulse text-slate-500">Redirecionando...</div>
    </div>
  );
}
