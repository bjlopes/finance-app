import { promises as fs } from "fs";
import path from "path";
import type { Transacao, Tag } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const TRANSACOES_FILE = path.join(DATA_DIR, "transacoes.json");
const TAGS_FILE = path.join(DATA_DIR, "tags.json");

const DEFAULT_TAGS: Tag[] = [
  { id: "1", nome: "transporte", cor: "#3b82f6" },
  { id: "2", nome: "alimentação", cor: "#f59e0b" },
  { id: "3", nome: "casa", cor: "#8b5cf6" },
  { id: "4", nome: "saúde", cor: "#ef4444" },
  { id: "5", nome: "pets", cor: "#10b981" },
  { id: "6", nome: "assinatura", cor: "#ec4899" },
  { id: "7", nome: "recorrente", cor: "#6b7280" },
  { id: "8", nome: "pontual", cor: "#6b7280" },
  { id: "9", nome: "necessidade", cor: "#22c55e" },
  { id: "10", nome: "desejo", cor: "#f97316" },
  { id: "11", nome: "investimento", cor: "#22c55e" },
];

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch { /* exists */ }
}

async function readJson<T>(file: string, defaultVal: T): Promise<T> {
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return defaultVal;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

export async function getTransacoes(): Promise<Transacao[]> {
  return readJson<Transacao[]>(TRANSACOES_FILE, []);
}

export async function saveTransacao(transacao: Transacao): Promise<void> {
  const transacoes = await getTransacoes();
  const index = transacoes.findIndex((t) => t.id === transacao.id);
  if (index >= 0) {
    transacoes[index] = transacao;
  } else {
    transacoes.push(transacao);
  }
  transacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  await writeJson(TRANSACOES_FILE, transacoes);
}

export async function deleteTransacao(id: string): Promise<void> {
  const transacoes = await getTransacoes();
  const filtered = transacoes.filter((t) => t.id !== id);
  await writeJson(TRANSACOES_FILE, filtered);
}

export async function getTags(): Promise<Tag[]> {
  const tags = await readJson<Tag[]>(TAGS_FILE, []);
  if (tags.length === 0) {
    await writeJson(TAGS_FILE, DEFAULT_TAGS);
    return DEFAULT_TAGS;
  }
  return tags;
}

export async function saveTag(tag: Tag): Promise<void> {
  const tags = await getTags();
  const index = tags.findIndex((t) => t.id === tag.id);
  if (index >= 0) {
    tags[index] = tag;
  } else {
    tags.push(tag);
  }
  await writeJson(TAGS_FILE, tags);
}

export async function deleteTag(id: string): Promise<void> {
  const tags = await getTags();
  const filtered = tags.filter((t) => t.id !== id);
  await writeJson(TAGS_FILE, filtered);
}
