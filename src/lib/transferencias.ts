import type { Transacao, Tag } from "@/types";
import type { ContaItem } from "@/context/DataContext";
import { getMesEfetivo } from "@/lib/fluxoCaixa";

/** Primeiro mês cujo saldo final alimenta o mês seguinte. */
export const SALDO_CARRY_OVER_INICIO = "2026-07";

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

function normalizarInvestimentoLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isNomeTagInvestimento(nome: string): boolean {
  const normalized = normalizarInvestimentoLabel(nome);
  return normalized === "investimento" || normalized === "investimentos";
}

function isTagOuAncestralInvestimento(
  tagId: string,
  tags: Tag[] = [],
  visitados = new Set<string>()
): boolean {
  if (visitados.has(tagId)) return false;
  visitados.add(tagId);
  const tag = tags.find((t) => t.id === tagId);
  if (!tag) return false;
  if (isNomeTagInvestimento(tag.nome)) return true;
  return Boolean(tag.parentId && isTagOuAncestralInvestimento(tag.parentId, tags, visitados));
}

export function hasTagInvestimento(t: Transacao, tags: Tag[] = []): boolean {
  return t.tagIds.some((tagId) => isTagOuAncestralInvestimento(tagId, tags));
}

export function isTransacaoInvestimento(
  t: Transacao,
  contas: ContaItem[],
  tags: Tag[] = []
): boolean {
  return isContaInvestimento(t.conta, contas) || hasTagInvestimento(t, tags);
}

export interface MovimentosInvestimento {
  aportes: number;
  resgates: number;
  qtdAportes: number;
  qtdResgates: number;
  /** Perna de destino dos resgates (valor positivo na conta que recebe). */
  transacoesResgate: Transacao[];
  /** Perna de origem dos aportes (valor negativo na conta que envia). */
  transacoesAporte: Transacao[];
}

/** Soma aportes (→ conta investimento) e resgates (← conta investimento) no mês. */
export function calcularMovimentosInvestimento(
  transacoes: Transacao[],
  contas: ContaItem[],
  mesYm: string,
  mesEfetivoDe: (t: Transacao) => string,
  contasAtivas?: string[],
  tags: Tag[] = []
): MovimentosInvestimento {
  let aportes = 0;
  let resgates = 0;
  let qtdAportes = 0;
  let qtdResgates = 0;
  const transacoesResgate: Transacao[] = [];
  const transacoesAporte: Transacao[] = [];

  for (const t of transacoes) {
    if (mesEfetivoDe(t) !== mesYm) continue;

    const valor = Math.abs(t.valor);
    const origem = t.conta;

    if (contasAtivas) {
      const destino = getContaDestinoTransferencia(t, transacoes);
      const origemAtiva = contasAtivas.includes(origem);
      const destinoAtivo = Boolean(destino && contasAtivas.includes(destino));
      if (!origemAtiva && !destinoAtivo) continue;
    }

    if (isTransferenciaOrigem(t)) {
      const destino = getContaDestinoTransferencia(t, transacoes);
      const par = getParTransferencia(t, transacoes);
      const destinoInvestimento = Boolean(destino && isContaInvestimento(destino, contas));
      const origemInvestimento = isContaInvestimento(origem, contas);
      const tagInvestimento = hasTagInvestimento(t, tags);

      if ((destinoInvestimento || tagInvestimento) && !origemInvestimento) {
        if (!contasAtivas || contasAtivas.includes(origem)) {
          aportes += valor;
          qtdAportes += 1;
          transacoesAporte.push(t);
        }
      }
      if (origemInvestimento) {
        if (!contasAtivas || (destino && contasAtivas.includes(destino))) {
          resgates += valor;
          qtdResgates += 1;
          if (par && par.valor > 0) transacoesResgate.push(par);
          else if (destino) {
            transacoesResgate.push({ ...t, valor, conta: destino });
          }
        }
      }
      continue;
    }

    if (isTransferenciaDestino(t)) continue;
    if (!isTransacaoInvestimento(t, contas, tags)) continue;

    if (t.valor < 0) {
      if (!contasAtivas || contasAtivas.includes(origem)) {
        aportes += valor;
        qtdAportes += 1;
        transacoesAporte.push(t);
      }
    }
    if (t.valor > 0) {
      if (!contasAtivas || contasAtivas.includes(origem)) {
        resgates += valor;
        qtdResgates += 1;
        transacoesResgate.push(t);
      }
    }
  }

  return { aportes, resgates, qtdAportes, qtdResgates, transacoesResgate, transacoesAporte };
}

/** Movimento líquido de cada conta no mês (inclui transferências e aportes). */
export function calcularSaldoPorContaMes(
  transacoesMes: Transacao[]
): Record<string, number> {
  const saldo: Record<string, number> = {};
  for (const t of transacoesMes) {
    saldo[t.conta] = (saldo[t.conta] || 0) + t.valor;
  }
  return saldo;
}

/**
 * Remove contas de investimento do mapa de saldos.
 * Investimentos só rastreiam aportes/resgates — sem saldo inicial/final.
 */
export function filtrarSaldosCaixa(
  saldoPorConta: Record<string, number>,
  contas: ContaItem[]
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(saldoPorConta).filter(([nome]) => !isContaInvestimento(nome, contas))
  );
}

export interface SaldosContaMes {
  saldoInicial: Record<string, number>;
  movimentoMes: Record<string, number>;
  saldoFinal: Record<string, number>;
}

/**
 * Saldo das contas de caixa no mês selecionado.
 * Contas de investimento ficam de fora (só aparecem em aportes/resgates).
 * Até o mês de início, usa apenas as transações do próprio mês.
 * Depois dele, carrega somente movimentos a partir de SALDO_CARRY_OVER_INICIO,
 * evitando recalcular retroativamente saldos que já foram lançados manualmente.
 */
export function calcularSaldosContaMes(
  transacoes: Transacao[],
  transacoesMes: Transacao[],
  contas: ContaItem[],
  mesYm: string,
  contasAtivas?: string[]
): SaldosContaMes {
  const saldoInicial: Record<string, number> = {};
  if (mesYm > SALDO_CARRY_OVER_INICIO) {
    for (const t of transacoes) {
      if (isContaInvestimento(t.conta, contas)) continue;
      if (contasAtivas && !contasAtivas.includes(t.conta)) continue;
      const mesEfetivo = getMesEfetivo(t, contas);
      if (mesEfetivo < SALDO_CARRY_OVER_INICIO || mesEfetivo >= mesYm) continue;
      saldoInicial[t.conta] = (saldoInicial[t.conta] || 0) + t.valor;
    }
  }

  const movimentoMes = filtrarSaldosCaixa(
    calcularSaldoPorContaMes(transacoesMes),
    contas
  );
  const nomes = new Set([...Object.keys(saldoInicial), ...Object.keys(movimentoMes)]);
  const saldoFinal: Record<string, number> = {};
  for (const nome of Array.from(nomes)) {
    saldoFinal[nome] = (saldoInicial[nome] || 0) + (movimentoMes[nome] || 0);
  }
  return { saldoInicial, movimentoMes, saldoFinal };
}

/**
 * Soma o movimento das contas no mês.
 * - patrimônio: todas as contas (transferências se cancelam entre si)
 * - caixa: só contas não-investimento (= fluxo disponível; investimento fica de fora)
 */
export function somarSaldoPorContaMes(
  saldoPorConta: Record<string, number>,
  contas: ContaItem[],
  modo: "patrimonio" | "caixa" = "patrimonio"
): number {
  return Object.entries(saldoPorConta).reduce((sum, [nome, valor]) => {
    if (modo === "caixa" && isContaInvestimento(nome, contas)) return sum;
    return sum + valor;
  }, 0);
}

/**
 * Receitas do dashboard: só entradas reais (custo de vida / renda).
 * Resgates de investimento ficam na seção Investimentos.
 */
export function totalReceitasDashboard(receitasFluxo: number): number {
  return receitasFluxo;
}

/**
 * Gastos do dashboard: só saídas reais (custo de vida).
 * Aportes para investimento ficam na seção Investimentos.
 */
export function totalGastosDashboard(gastosFluxo: number): number {
  return gastosFluxo;
}

/**
 * Saldo do mês no dashboard: receitas − gastos (fluxo real).
 * Não inclui aportes nem resgates — esses movimentos são alocação de patrimônio.
 */
export function calcularSaldoMes(
  totalReceitas: number,
  totalGastos: number
): number {
  return totalReceitas - totalGastos;
}
