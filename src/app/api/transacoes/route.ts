import { NextRequest, NextResponse } from "next/server";
import { getTransacoes, saveTransacao, deleteTransacao } from "@/lib/db";
import type { Transacao } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tagIds = searchParams.get("tags")?.split(",").filter(Boolean);

  let transacoes = await getTransacoes();

  if (tagIds?.length) {
    transacoes = transacoes.filter((t) =>
      tagIds.some((id) => t.tagIds.includes(id))
    );
  }

  return NextResponse.json(transacoes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const transacao: Transacao = {
    id: body.id || crypto.randomUUID(),
    data: body.data || new Date().toISOString().split("T")[0],
    descricao: body.descricao || "",
    valor: Number(body.valor) || 0,
    conta: body.conta || "Nubank",
    tagIds: body.tagIds || [],
    recorrente: body.recorrente ?? false,
  };
  await saveTransacao(transacao);
  return NextResponse.json(transacao);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteTransacao(id);
  return NextResponse.json({ ok: true });
}
