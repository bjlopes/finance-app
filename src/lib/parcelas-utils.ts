import type { Transacao } from "@/types";
import { getLocalDateString } from "./dateUtils";

export function parseParcela(
  descricao: string
): { base: string; n: number; total: number } | null {
  const match = descricao.match(/^(.+?)\s+(\d+)\/(\d+)$/);
  if (!match) return null;
  return {
    base: match[1].trim(),
    n: parseInt(match[2], 10),
    total: parseInt(match[3], 10),
  };
}

/**
 * Agrupa parcelas por base|conta|total.
 * Todas as parcelas com mesmo nome, conta e total ficam no mesmo grupo.
 */
export function groupParceladas(transacoes: Transacao[]): Map<string, Transacao[]> {
  const groups = new Map<string, Transacao[]>();
  for (const t of transacoes) {
    const p = parseParcela(t.descricao);
    if (!p) continue;
    const key = `${p.base}|${t.conta}|${p.total}`;
    const arr = groups.get(key) ?? [];
    arr.push(t);
    groups.set(key, arr);
  }
  Array.from(groups.values()).forEach((arr) => {
    arr.sort((a, b) => {
      const pa = parseParcela(a.descricao)!;
      const pb = parseParcela(b.descricao)!;
      return pa.n - pb.n;
    });
  });
  return groups;
}

/** Filtra grupos que têm pelo menos uma parcela a pagar (vencimento da fatura >= hoje) */
export function filterGruposAtivos(
  grupos: [string, Transacao[]][],
  getDataVencimento: (t: Transacao) => string
): [string, Transacao[]][] {
  const hoje = getLocalDateString();
  return grupos.filter(([, parcelas]) =>
    parcelas.some((p) => getDataVencimento(p) >= hoje)
  );
}

export function isParcelada(descricao: string): boolean {
  return parseParcela(descricao) !== null;
}
