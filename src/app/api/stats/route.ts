import { NextResponse } from "next/server";
import { getTransacoes } from "@/lib/db";
import { getTags } from "@/lib/db";

export async function GET() {
  const [transacoes, tags] = await Promise.all([getTransacoes(), getTags()]);

  const now = new Date();
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const transacoesMes = transacoes.filter((t) => t.data.startsWith(mesAtual));

  const totalGastos = transacoesMes
    .filter((t) => t.valor < 0)
    .reduce((sum, t) => sum + t.valor, 0);

  const totalReceitas = transacoesMes
    .filter((t) => t.valor > 0)
    .reduce((sum, t) => sum + t.valor, 0);

  const porTag: Record<string, number> = {};
  transacoesMes
    .filter((t) => t.valor < 0)
    .forEach((t) => {
      t.tagIds.forEach((tagId) => {
        const tag = tags.find((tg) => tg.id === tagId);
        const nome = tag?.nome || "sem tag";
        porTag[nome] = (porTag[nome] || 0) + Math.abs(t.valor);
      });
    });

  const topTags = Object.entries(porTag)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nome, valor]) => ({ nome, valor }));

  return NextResponse.json({
    totalGastosMes: Math.abs(totalGastos),
    totalReceitasMes: totalReceitas,
    saldoMes: totalReceitas + totalGastos,
    topTags,
    totalTransacoes: transacoes.length,
  });
}
