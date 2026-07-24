import type { Transacao, Tag } from "@/types";
import type { ContaItem } from "@/context/DataContext";
import { getMesEfetivo, getMesFaturaPagaEm } from "@/lib/fluxoCaixa";

/** Primeiro mês cujo saldo final alimenta o mês seguinte. */
export const SALDO_CARRY_OVER_INICIO = "2026-07";

function addMesYm(mesYm: string, delta: number): string {
  const [ano, mes] = mesYm.split("-").map(Number);
  const d = new Date(ano, mes - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

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

export function isContaCartaoCredito(nome: string, contas: ContaItem[]): boolean {
  const conta = contas.find((c) => c.nome === nome);
  return Boolean(conta?.isCartaoCredito);
}

/** Contas que acumulam saldo mês a mês (corrente, Flash etc.). Cartões e investimentos ficam de fora. */
export function isContaComCarryOver(nome: string, contas: ContaItem[]): boolean {
  return !isContaInvestimento(nome, contas) && !isContaCartaoCredito(nome, contas);
}

function normalizarLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isNomeUltraviolet(nome: string): boolean {
  const n = normalizarLabel(nome);
  return n.includes("ultraviolet") || n.includes("ultravioleta");
}

function isNomeCartaoItau(nome: string): boolean {
  const n = normalizarLabel(nome);
  return (
    n.includes("cartao itau") ||
    n.includes("itau cartao") ||
    n === "cartao itau" ||
    (n.includes("itau") && n.includes("cartao"))
  );
}

function isNomeNubankCaixa(nome: string): boolean {
  const n = normalizarLabel(nome);
  if (isNomeUltraviolet(n)) return false;
  return n === "nubank" || n === "nu bank" || n.includes("nubank");
}

/**
 * Migra contas já existentes para a lógica de cartão/pagamento.
 * - Marca Ultraviolet e Cartão Itaú como cartão (sem carry-over).
 * - Liga Ultraviolet → Nubank com pagamento no dia 14 (fechamento dia 7).
 * Assim julho/agosto (e meses seguintes) passam a descontar a fatura sem setup manual.
 */
export function migrarContasCartoesPagamento(contas: ContaItem[]): {
  contas: ContaItem[];
  alteradas: number;
} {
  const nubankCaixa = contas.find(
    (c) => isNomeNubankCaixa(c.nome) && !c.isCartaoCredito && !c.isInvestimento
  );

  let alteradas = 0;
  const next = contas.map((conta) => {
    let atualizada = { ...conta };
    let mudou = false;

    if (isNomeUltraviolet(conta.nome)) {
      if (!atualizada.isCartaoCredito) {
        atualizada.isCartaoCredito = true;
        mudou = true;
      }
      if (atualizada.dataFechamento == null) {
        atualizada.dataFechamento = 7;
        mudou = true;
      }
      if (nubankCaixa) {
        if (!atualizada.contaPagamentoId) {
          atualizada.contaPagamentoId = nubankCaixa.id;
          mudou = true;
        }
        if (atualizada.diaPagamento == null) {
          atualizada.diaPagamento = 14;
          mudou = true;
        }
      }
    } else if (isNomeCartaoItau(conta.nome)) {
      if (!atualizada.isCartaoCredito) {
        atualizada.isCartaoCredito = true;
        mudou = true;
      }
    }

    if (mudou) alteradas += 1;
    return atualizada;
  });

  return { contas: next, alteradas };
}

function isNomeTagInvestimento(nome: string): boolean {
  const normalized = normalizarLabel(nome);
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

export interface PagamentoFaturaMes {
  cartaoNome: string;
  contaPagamentoNome: string;
  valor: number;
  diaPagamento: number;
  mesFatura: string;
}

export interface SaldosContaMes {
  saldoInicial: Record<string, number>;
  movimentoMes: Record<string, number>;
  saldoFinal: Record<string, number>;
  /** Pagamentos de fatura debitados das contas de caixa no mês selecionado. */
  pagamentosFatura: PagamentoFaturaMes[];
}

function valorFaturaCartao(
  transacoes: Transacao[],
  cartaoNome: string,
  mesFatura: string,
  contas: ContaItem[]
): number {
  let saldo = 0;
  for (const t of transacoes) {
    if (t.conta !== cartaoNome) continue;
    if (getMesEfetivo(t, contas) !== mesFatura) continue;
    saldo += t.valor;
  }
  return Math.max(0, -saldo);
}

function listarPagamentosFaturaNoMes(
  transacoes: Transacao[],
  contas: ContaItem[],
  mesPagamentoYm: string,
  contasAtivas?: string[]
): PagamentoFaturaMes[] {
  const pagamentos: PagamentoFaturaMes[] = [];
  for (const cartao of contas) {
    if (!cartao.isCartaoCredito || !cartao.contaPagamentoId || cartao.diaPagamento == null) {
      continue;
    }
    // Débito da fatura na conta de caixa a partir do marco de carry-over (jul/2026).
    if (mesPagamentoYm < SALDO_CARRY_OVER_INICIO) continue;
    const contaPagamento = contas.find((c) => c.id === cartao.contaPagamentoId);
    if (!contaPagamento || isContaInvestimento(contaPagamento.nome, contas)) continue;
    if (contasAtivas && !contasAtivas.includes(contaPagamento.nome)) continue;

    const mesFatura = getMesFaturaPagaEm(mesPagamentoYm, cartao);
    if (!mesFatura) continue;

    const valor = valorFaturaCartao(transacoes, cartao.nome, mesFatura, contas);
    if (valor <= 0) continue;

    pagamentos.push({
      cartaoNome: cartao.nome,
      contaPagamentoNome: contaPagamento.nome,
      valor,
      diaPagamento: cartao.diaPagamento,
      mesFatura,
    });
  }
  return pagamentos;
}

function aplicarPagamentosNoMapa(
  mapa: Record<string, number>,
  pagamentos: PagamentoFaturaMes[]
): void {
  for (const p of pagamentos) {
    mapa[p.contaPagamentoNome] = (mapa[p.contaPagamentoNome] || 0) - p.valor;
  }
}

/**
 * Saldo das contas no mês selecionado.
 * - Contas de investimento ficam de fora (só aportes/resgates).
 * - Cartões de crédito NÃO fazem carry-over: o saldo do mês é só a fatura daquele ciclo.
 * - Contas de caixa (corrente, Flash etc.) carregam saldo a partir de SALDO_CARRY_OVER_INICIO.
 * - Cartões com conta de pagamento debitam a fatura dessa conta no dia configurado.
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
      if (!isContaComCarryOver(t.conta, contas)) continue;
      if (contasAtivas && !contasAtivas.includes(t.conta)) continue;
      const mesEfetivo = getMesEfetivo(t, contas);
      if (mesEfetivo < SALDO_CARRY_OVER_INICIO || mesEfetivo >= mesYm) continue;
      saldoInicial[t.conta] = (saldoInicial[t.conta] || 0) + t.valor;
    }

    for (
      let mes = SALDO_CARRY_OVER_INICIO;
      mes < mesYm;
      mes = addMesYm(mes, 1)
    ) {
      aplicarPagamentosNoMapa(
        saldoInicial,
        listarPagamentosFaturaNoMes(transacoes, contas, mes, contasAtivas)
      );
    }
  }

  const movimentoMes = filtrarSaldosCaixa(
    calcularSaldoPorContaMes(transacoesMes),
    contas
  );
  const pagamentosFatura = listarPagamentosFaturaNoMes(
    transacoes,
    contas,
    mesYm,
    contasAtivas
  );
  aplicarPagamentosNoMapa(movimentoMes, pagamentosFatura);

  const nomes = new Set([...Object.keys(saldoInicial), ...Object.keys(movimentoMes)]);
  const saldoFinal: Record<string, number> = {};
  for (const nome of Array.from(nomes)) {
    saldoFinal[nome] = (saldoInicial[nome] || 0) + (movimentoMes[nome] || 0);
  }
  return { saldoInicial, movimentoMes, saldoFinal, pagamentosFatura };
}

/**
 * Soma o movimento das contas no mês.
 * - patrimônio: todas as contas (transferências se cancelam entre si)
 * - caixa: só contas não-investimento e não-cartão (= dinheiro disponível)
 */
export function somarSaldoPorContaMes(
  saldoPorConta: Record<string, number>,
  contas: ContaItem[],
  modo: "patrimonio" | "caixa" = "patrimonio"
): number {
  return Object.entries(saldoPorConta).reduce((sum, [nome, valor]) => {
    if (modo === "caixa" && !isContaComCarryOver(nome, contas)) return sum;
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

export function isTagTransacoesInternas(tag: Tag): boolean {
  const nome = normalizarLabel(tag.nome);
  return (
    nome === "transacoes internas" ||
    nome === "transacao interna" ||
    nome === "transferencias internas" ||
    nome === "transferencia interna"
  );
}

export function getTagIdsTransacoesInternas(tags: Tag[]): Set<string> {
  return new Set(tags.filter(isTagTransacoesInternas).map((t) => t.id));
}

function hasTagId(t: Transacao, tagIds: Set<string>): boolean {
  return t.tagIds.some((id) => tagIds.has(id));
}

function valorAbsCents(valor: number): number {
  return Math.round(Math.abs(valor) * 100);
}

export interface ConversaoTransacoesInternasResult {
  transacoes: Transacao[];
  convertidas: number;
  semPar: number;
}

export function hasTagTransacoesInternas(t: Transacao, tags: Tag[]): boolean {
  const tagIds = getTagIdsTransacoesInternas(tags);
  return tagIds.size > 0 && hasTagId(t, tagIds);
}

/**
 * Converte lançamentos da tag "transações internas" em transferências reais.
 * Emparelha saída (−) e entrada (+) com mesmo valor e data, contas diferentes.
 * Pelo menos uma das pernas precisa ter a tag. Idempotente para pares já convertidos.
 */
export function converterTransacoesInternasParaTransferencias(
  transacoes: Transacao[],
  tags: Tag[],
  newId: () => string = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `tid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
): ConversaoTransacoesInternasResult {
  const tagIds = getTagIdsTransacoesInternas(tags);
  if (tagIds.size === 0) {
    return { transacoes, convertidas: 0, semPar: 0 };
  }

  const candidatos = transacoes.filter(
    (t) => !isTransferencia(t) && hasTagId(t, tagIds)
  );
  if (candidatos.length === 0) {
    return { transacoes, convertidas: 0, semPar: 0 };
  }

  const usadas = new Set<string>();
  const substituicoes = new Map<string, Transacao>();
  let convertidas = 0;

  const saidas = candidatos
    .filter((t) => t.valor < 0)
    .sort((a, b) => a.data.localeCompare(b.data) || a.id.localeCompare(b.id));

  for (const origem of saidas) {
    if (usadas.has(origem.id)) continue;

    const valorCents = valorAbsCents(origem.valor);
    const possiveis = transacoes.filter((t) => {
      if (usadas.has(t.id) || t.id === origem.id) return false;
      if (isTransferencia(t)) return false;
      if (t.valor <= 0) return false;
      if (t.data !== origem.data) return false;
      if (t.conta === origem.conta) return false;
      if (valorAbsCents(t.valor) !== valorCents) return false;
      if (origem.contaDestino && t.conta !== origem.contaDestino) return false;
      return hasTagId(origem, tagIds) || hasTagId(t, tagIds);
    });

    possiveis.sort((a, b) => {
      const score = (t: Transacao) =>
        (hasTagId(t, tagIds) ? 2 : 0) +
        (t.descricao === origem.descricao ? 1 : 0) +
        (origem.contaDestino === t.conta ? 3 : 0);
      return score(b) - score(a) || a.id.localeCompare(b.id);
    });

    const destino = possiveis[0];
    if (!destino) continue;

    const transferenciaId = newId();
    const descricao =
      origem.descricao.trim() || destino.descricao.trim() || "Transferência";
    const valor = Math.round(Math.abs(origem.valor) * 100) / 100;
    const comentario = origem.comentario || destino.comentario;

    const novaOrigem: Transacao = {
      ...origem,
      descricao,
      valor: -valor,
      conta: origem.conta,
      contaDestino: destino.conta,
      data: origem.data,
      tagIds: [],
      comentario,
      transferenciaId,
    };
    const novaDestino: Transacao = {
      ...destino,
      descricao,
      valor,
      conta: destino.conta,
      data: destino.data,
      tagIds: [],
      comentario,
      transferenciaId,
      contaDestino: undefined,
    };

    usadas.add(origem.id);
    usadas.add(destino.id);
    substituicoes.set(origem.id, novaOrigem);
    substituicoes.set(destino.id, novaDestino);
    convertidas += 1;
  }

  if (convertidas === 0) {
    return { transacoes, convertidas: 0, semPar: candidatos.length };
  }

  const next = transacoes.map((t) => substituicoes.get(t.id) ?? t);
  const semPar = next.filter(
    (t) => !isTransferencia(t) && hasTagId(t, tagIds)
  ).length;

  return { transacoes: next, convertidas, semPar };
}
