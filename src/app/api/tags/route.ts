import { NextRequest, NextResponse } from "next/server";
import { getTags, saveTag, deleteTag } from "@/lib/db";
import type { Tag } from "@/types";

export async function GET() {
  const tags = await getTags();
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tag: Tag = {
    id: body.id || crypto.randomUUID(),
    nome: (body.nome || "").toLowerCase().trim(),
    cor: body.cor || "#6b7280",
    ...(body.parentId ? { parentId: body.parentId } : {}),
  };
  await saveTag(tag);
  return NextResponse.json(tag);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteTag(id);
  return NextResponse.json({ ok: true });
}
