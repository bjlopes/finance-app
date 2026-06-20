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

/** Grupos em que todas as parcelas já “venceram” (vencimento da fatura antes de hoje) */
export function filterGruposEncerrados(
  grupos: [string, Transacao[]][],
  getDataVencimento: (t: Transacao) => string
): [string, Transacao[]][] {
  const hoje = getLocalDateString();
  return grupos.filter(
    ([, parcelas]) =>
      parcelas.length > 0 && parcelas.every((p) => getDataVencimento(p) < hoje)
  );
}

export function isParcelada(descricao: string): boolean {
  return parseParcela(descricao) !== null;
}

/** Divide um total em N parcelas; centavos restantes vão para a 1ª. */
export function distribuirValorParcelas(total: number, n: number): number[] {
  if (n <= 0) return [];
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / n);
  const resto = totalCents - baseCents * n;

  if (resto === 0) {
    const valor = baseCents / 100;
    return Array(n).fill(valor);
  }

  const valores: number[] = [(baseCents + resto) / 100];
  for (let i = 1; i < n; i++) {
    valores.push(baseCents / 100);
  }
  return valores;
}

/** Garante exatamente `n` valores; redistribui se o array estiver incompleto. */
export function normalizarValoresParcelas(
  valores: number[],
  n: number,
  totalFallback: number
): number[] {
  if (n <= 0) return [];
  if (
    valores.length === n &&
    valores.every((v) => typeof v === "number" && !Number.isNaN(v) && v > 0)
  ) {
    return valores;
  }
  const total =
    totalFallback > 0
      ? totalFallback
      : valores.reduce((s, v) => s + (v || 0), 0);
  return distribuirValorParcelas(total, n);
}

/** Mapa parcela n → transação (para edição sem perder a 1ª parcela). */
export function mapParcelasPorNumero(
  parcelas: Transacao[]
): Map<number, Transacao> {
  const map = new Map<number, import("@/types").Transacao>();
  for (const p of parcelas) {
    const parsed = parseParcela(p.descricao);
    if (parsed) map.set(parsed.n, p);
  }
  return map;
}
