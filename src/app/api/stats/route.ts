import { NextResponse } from "next/server";
import { getTransacoes, getTags, getContas } from "@/lib/db";
import { calcMesStats, getMesAtualYm } from "@/lib/stats";

export async function GET() {
  const [transacoes, tags, contas] = await Promise.all([
    getTransacoes(),
    getTags(),
    getContas(),
  ]);

  const mesAtual = getMesAtualYm();
  const stats = calcMesStats(transacoes, tags, contas, mesAtual);

  return NextResponse.json(stats);
}
