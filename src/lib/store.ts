"use client";

import type { Transacao, Tag } from "@/types";

const STORAGE_KEY = "finance-app-data";
const BACKUP_KEY = "finance-app-backup";

const DEFAULT_CONTAS = ["Nubank", "Dinheiro", "Casa", "Alimentação"];

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

function migrateTag(t: Tag & { tipo?: string }): Tag {
  const { tipo, ...rest } = t;
  return rest;
}

function migrateTags(tags: (Tag & { tipo?: string })[]): Tag[] {
  return tags.map(migrateTag);
}

interface ContaItem {
  id: string;
  nome: string;
  isCartaoCredito?: boolean;
  dataFechamento?: number;
}

interface StoredData {
  transacoes: Transacao[];
  tags: Tag[];
  contas: ContaItem[];
}

function getDefaultContas(): ContaItem[] {
  return DEFAULT_CONTAS.map((nome, i) => ({ id: `conta-${i}`, nome }));
}

function getStored(): StoredData {
  if (typeof window === "undefined") {
    return { transacoes: [], tags: [], contas: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const backup = tryRestoreFromBackup();
      if (backup) return backup;
      return { transacoes: [], tags: DEFAULT_TAGS, contas: getDefaultContas() };
    }
    const parsed = JSON.parse(raw) as StoredData & { tags?: (Tag & { tipo?: string })[] };
    const tagsRaw = parsed.tags?.length ? parsed.tags : DEFAULT_TAGS;
    const tags = migrateTags(tagsRaw as (Tag & { tipo?: string })[]);
    return {
      transacoes: parsed.transacoes || [],
      tags,
      contas: (parsed.contas?.length ? parsed.contas : getDefaultContas()) as ContaItem[],
    };
  } catch {
    const backup = tryRestoreFromBackup();
    if (backup) return backup;
    return { transacoes: [], tags: DEFAULT_TAGS, contas: getDefaultContas() };
  }
}

function tryRestoreFromBackup(): StoredData | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredData & { _backupAt?: string; tags?: (Tag & { tipo?: string })[] };
    if (!Array.isArray(parsed.transacoes) || !Array.isArray(parsed.tags) || !Array.isArray(parsed.contas))
      return null;
    const data: StoredData = {
      transacoes: parsed.transacoes,
      tags: migrateTags((parsed.tags || []) as (Tag & { tipo?: string })[]),
      contas: parsed.contas,
    };
    setStored(data);
    return data;
  } catch {
    return null;
  }
}

export function saveAutoBackup(): void {
  if (typeof window === "undefined") return;
  try {
    const data = getStored();
    if (data.transacoes.length > 0 || data.tags.length > 0 || data.contas.length > 0) {
      localStorage.setItem(
        BACKUP_KEY,
        JSON.stringify({ ...data, _backupAt: new Date().toISOString() })
      );
    }
  } catch {
    // ignore
  }
}

function setStored(data: StoredData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (data.transacoes.length > 0 || data.tags.length > 0 || data.contas.length > 0) {
      localStorage.setItem(
        BACKUP_KEY,
        JSON.stringify({ ...data, _backupAt: new Date().toISOString() })
      );
    }
  } catch (e) {
    console.error("Erro ao salvar no localStorage:", e);
  }
}

export function setFullData(data: StoredData) {
  setStored(data);
}

export function clearLocalData(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
  } catch {
    // ignore
  }
}

export function exportBackup(): string {
  const data = getStored();
  return JSON.stringify(
    { ...data, _exportedAt: new Date().toISOString() },
    null,
    2
  );
}

export function importBackup(json: string): { ok: boolean; error?: string } {
  if (typeof window === "undefined") return { ok: false, error: "Não disponível" };
  try {
    const parsed = JSON.parse(json) as StoredData & { _exportedAt?: string };
    const tagsRaw = Array.isArray(parsed.tags) ? parsed.tags : DEFAULT_TAGS;
    const data: StoredData = {
      transacoes: Array.isArray(parsed.transacoes) ? parsed.transacoes : [],
      tags: migrateTags(tagsRaw as (Tag & { tipo?: string })[]),
      contas: Array.isArray(parsed.contas) ? parsed.contas : getDefaultContas(),
    };
    setStored(data);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Arquivo inválido" };
  }
}

export function getTransacoes(): Transacao[] {
  return getStored().transacoes;
}

export function saveTransacao(transacao: Transacao): void {
  const { transacoes, tags, contas } = getStored();
  const index = transacoes.findIndex((t) => t.id === transacao.id);
  const next = [...transacoes];
  if (index >= 0) {
    next[index] = transacao;
  } else {
    next.push(transacao);
  }
  next.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  setStored({ transacoes: next, tags, contas });
}

export function deleteTransacao(id: string): void {
  const { transacoes, tags, contas } = getStored();
  setStored({
    transacoes: transacoes.filter((t) => t.id !== id),
    tags,
    contas,
  });
}

export function getTags(): Tag[] {
  return getStored().tags;
}

export function saveTag(tag: Tag): void {
  const { transacoes, tags, contas } = getStored();
  const index = tags.findIndex((t) => t.id === tag.id);
  const next = [...tags];
  if (index >= 0) {
    next[index] = tag;
  } else {
    next.push(tag);
  }
  setStored({ transacoes, tags: next, contas });
}

function getDescendantIds(tags: Tag[], parentId: string): Set<string> {
  const ids = new Set<string>([parentId]);
  let changed = true;
  while (changed) {
    changed = false;
    tags.forEach((t) => {
      if (t.parentId && ids.has(t.parentId) && !ids.has(t.id)) {
        ids.add(t.id);
        changed = true;
      }
    });
  }
  return ids;
}

export function deleteTag(id: string): void {
  const { transacoes, tags, contas } = getStored();
  const toRemove = getDescendantIds(tags, id);
  const nextTags = tags.filter((t) => !toRemove.has(t.id));
  setStored({ transacoes, tags: nextTags, contas });
}

export function getContas(): ContaItem[] {
  return getStored().contas;
}

export function saveConta(conta: ContaItem): void {
  const { transacoes, tags, contas } = getStored();
  const index = contas.findIndex((c) => c.id === conta.id);
  const next = [...contas];
  if (index >= 0) {
    next[index] = conta;
  } else {
    next.push(conta);
  }
  setStored({ transacoes, tags, contas: next });
}

export function deleteConta(id: string): void {
  const { transacoes, tags, contas } = getStored();
  setStored({
    transacoes,
    tags,
    contas: contas.filter((c) => c.id !== id),
  });
}

export function loadSampleData(): void {
  const { tags } = getStored();
  const hoje = new Date();
  const mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const sample: Transacao[] = [
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

  const { transacoes, contas } = getStored();
  setStored({
    transacoes: [...transacoes, ...sample],
    tags,
    contas,
  });
}
