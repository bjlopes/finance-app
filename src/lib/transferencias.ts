import type { Transacao } from "@/types";
import type { ContaItem } from "@/context/DataContext";

export function isTransferencia(t: Transacao): boolean {
  return Boolean(t.transferenciaId);
}

export function isTransferenciaDestino(t: Transacao): boolean {
  return Boolean(t.transferenciaId && t.valor > 0);
}

export function isTransferenciaOrigem(t: Transacao): boolean {
  return Boolean(t.transferenciaId && t.valor < 0);
}

export function getParTransferencia(
  t: Transacao,
  transacoes: Transacao[]
): Transacao | undefined {
  if (!t.transferenciaId) return undefined;
  return transacoes.find(
    (x) => x.transferenciaId === t.transferenciaId && x.id !== t.id
  );
}

export function getContaDestinoTransferencia(
  t: Transacao,
  transacoes: Transacao[]
): string | undefined {
  if (t.contaDestino) return t.contaDestino;
  const par = getParTransferencia(t, transacoes);
  if (!par) return undefined;
  return t.valor < 0 ? par.conta : t.conta;
}

export function getContaOrigemTransferencia(
  t: Transacao,
  transacoes: Transacao[]
): string {
  if (t.valor < 0) return t.conta;
  const par = getParTransferencia(t, transacoes);
  return par?.conta ?? t.conta;
}

/** Exclui transferências de receitas, gastos e tags (não são receita/despesa real). */
export function isFluxoReal(t: Transacao): boolean {
  return !isTransferencia(t);
}

/** Lista principal: uma linha por transferência (perna de origem). */
export function filtrarTransacoesParaLista(transacoes: Transacao[]): Transacao[] {
  return transacoes.filter((t) => !isTransferenciaDestino(t));
}

export interface TransferenciaInput {
  transferenciaId?: string;
  descricao: string;
  valor: number;
  contaOrigem: string;
  contaDestino: string;
  data: string;
  comentario?: string;
}

export function isContaInvestimento(nome: string, contas: ContaItem[]): boolean {
  const conta = contas.find((c) => c.nome === nome);
  return Boolean(conta?.isInvestimento);
}

export interface MovimentosInvestimento {
  aportes: number;
  resgates: number;
  qtdAportes: number;
  qtdResgates: number;
}

/** Soma aportes (→ conta investimento) e resgates (← conta investimento) no mês. */
export function calcularMovimentosInvestimento(
  transacoes: Transacao[],
  contas: ContaItem[],
  mesYm: string,
  mesEfetivoDe: (t: Transacao) => string
): MovimentosInvestimento {
  let aportes = 0;
  let resgates = 0;
  let qtdAportes = 0;
  let qtdResgates = 0;

  for (const t of transacoes) {
    if (!isTransferenciaOrigem(t)) continue;
    if (mesEfetivoDe(t) !== mesYm) continue;

    const valor = Math.abs(t.valor);
    const destino = getContaDestinoTransferencia(t, transacoes);
    const origem = t.conta;

    if (destino && isContaInvestimento(destino, contas)) {
      aportes += valor;
      qtdAportes += 1;
    }
    if (isContaInvestimento(origem, contas)) {
      resgates += valor;
      qtdResgates += 1;
    }
  }

  return { aportes, resgates, qtdAportes, qtdResgates };
}

/**
 * Saldo do mês no dashboard: receitas − gastos reais, ajustado por investimentos.
 * Resgates voltam para o fluxo (+); aportes saem do fluxo (−), sem virar “gasto”.
 */
export function calcularSaldoFluxoMes(
  totalReceitas: number,
  totalGastos: number,
  investimento: MovimentosInvestimento
): number {
  return (
    totalReceitas - totalGastos + investimento.resgates - investimento.aportes
  );
}
