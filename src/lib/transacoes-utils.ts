import type { Transacao } from "@/types";
import { parseLocalDate } from "./dateUtils";

/** Ordena por data (mais recente primeiro); mesma data → última adicionada no topo. */
export function compareTransacoesDesc(a: Transacao, b: Transacao): number {
  const dateDiff =
    parseLocalDate(b.data).getTime() - parseLocalDate(a.data).getTime();
  if (dateDiff !== 0) return dateDiff;

  const aTs = a.criadoEm ? Date.parse(a.criadoEm) : 0;
  const bTs = b.criadoEm ? Date.parse(b.criadoEm) : 0;
  if (bTs !== aTs) return bTs - aTs;

  return b.id.localeCompare(a.id);
}

export function sortTransacoesDesc(transacoes: Transacao[]): Transacao[] {
  return [...transacoes].sort(compareTransacoesDesc);
}

export function withCriadoEm(
  transacao: Transacao,
  criadoEm?: string
): Transacao {
  if (transacao.criadoEm) return transacao;
  return { ...transacao, criadoEm: criadoEm ?? new Date().toISOString() };
}
