import { NextResponse } from "next/server";
import { getTransacoes, getTags, saveTransacao } from "@/lib/db";

export async function POST() {
  const [transacoes, tags] = await Promise.all([
    getTransacoes(),
    getTags(),
  ]);

  if (transacoes.length > 0) {
    return NextResponse.json({
      message: "Já existem transações. Seed ignorado.",
      transacoes: transacoes.length,
    });
  }

  const hoje = new Date();
  const mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const sample = [
    {
      id: crypto.randomUUID(),
      descricao: "Petz - Ração",
      valor: -172.34,
      conta: "Nubank",
      data: `${mes}-05`,
      tagIds: tags.filter((t) => t.nome === "pets").map((t) => t.id),
      recorrente: false,
    },
    {
      id: crypto.randomUUID(),
      descricao: "Uber",
      valor: -37.06,
      conta: "Nubank",
      data: `${mes}-03`,
      tagIds: tags.filter((t) => t.nome === "transporte").map((t) => t.id),
      recorrente: false,
    },
    {
      id: crypto.randomUUID(),
      descricao: "ChatGPT+",
      valor: -99.9,
      conta: "Nubank",
      data: `${mes}-01`,
      tagIds: tags.filter((t) => t.nome === "assinatura").map((t) => t.id),
      recorrente: true,
    },
    {
      id: crypto.randomUUID(),
      descricao: "Salário",
      valor: 14000,
      conta: "Nubank",
      data: `${mes}-05`,
      tagIds: [],
      recorrente: false,
    },
  ];

  for (const t of sample) {
    await saveTransacao(t);
  }

  return NextResponse.json({
    message: "Dados de exemplo criados!",
    count: sample.length,
  });
}
