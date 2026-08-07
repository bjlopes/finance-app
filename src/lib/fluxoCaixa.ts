import type { Transacao } from "@/types";
import type { ContaItem } from "@/context/DataContext";

/** Dias entre o fechamento da fatura e o vencimento/pagamento. */
export const DIAS_APOS_FECHAMENTO = 7;

function addMesYm(mesYm: string, delta: number): string {
  const [ano, mes] = mesYm.split("-").map(Number);
  const d = new Date(ano, mes - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDataLocal(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function hojeYmD(hoje: Date = new Date()): string {
  return formatDataLocal(
    new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
  );
}

/**
 * Dia do calendário do pagamento a partir do fechamento (fechamento + 7 dias).
 * Usa um mês de 31 dias só para obter o número do dia (ex. 25 → 1 do mês seguinte).
 */
export function diaPagamentoFromFechamento(dataFechamento: number): number {
  const d = new Date(2026, 0, dataFechamento);
  d.setDate(d.getDate() + DIAS_APOS_FECHAMENTO);
  return d.getDate();
}

/**
 * Data de pagamento (vencimento) da fatura do mês efetivo: fechamento + 7 dias.
 * Retorna YYYY-MM-DD ou null se o cartão não tiver fechamento.
 */
export function getDataPagamentoFaturaMes(
  mesFaturaYm: string,
  cartao: ContaItem
): string | null {
  if (!cartao.isCartaoCredito || cartao.dataFechamento == null) return null;
  const [y, m] = mesFaturaYm.split("-").map(Number);
  const d = new Date(y, m - 1, cartao.dataFechamento);
  d.setDate(d.getDate() + DIAS_APOS_FECHAMENTO);
  return formatDataLocal(d);
}

/**
 * Mês da fatura cujo pagamento cai em `mesPagamentoYm`.
 * Derivado de fechamento + 7 (não do campo diaPagamento manual).
 */
export function getMesFaturaPagaEm(
  mesPagamentoYm: string,
  cartao: ContaItem
): string | null {
  if (!cartao.isCartaoCredito || !cartao.contaPagamentoId || cartao.dataFechamento == null) {
    return null;
  }
  for (const mesFatura of [mesPagamentoYm, addMesYm(mesPagamentoYm, -1)]) {
    const dataPagamento = getDataPagamentoFaturaMes(mesFatura, cartao);
    if (dataPagamento && dataPagamento.slice(0, 7) === mesPagamentoYm) {
      return mesFatura;
    }
  }
  return null;
}

/** True se a data de pagamento (fechamento + 7) da fatura já chegou. */
export function pagamentoFaturaJaOcorreu(
  mesFaturaYm: string,
  cartao: ContaItem,
  hoje: Date = new Date()
): boolean {
  const dataPagamento = getDataPagamentoFaturaMes(mesFaturaYm, cartao);
  if (!dataPagamento) return false;
  return hojeYmD(hoje) >= dataPagamento;
}

/**
 * Retorna a data de vencimento da fatura que contém esta transação.
 * Para cartão de crédito: fatura fecha no dataFechamento, vence 7 dias depois.
 * Para outras contas: usa a própria data da transação.
 */
export function getDataVencimentoFatura(
  t: Transacao,
  contas: ContaItem[]
): string {
  const conta = contas.find((c) => c.nome === t.conta);
  if (!conta?.isCartaoCredito || conta.dataFechamento == null) {
    return t.data;
  }
  const mesEfetivo = getMesEfetivo(t, contas);
  return getDataPagamentoFaturaMes(mesEfetivo, conta) ?? t.data;
}

/**
 * Retorna o mês efetivo para fluxo de caixa.
 * - Contas NÃO marcadas como cartão de crédito: usa o mês da data da transação
 *   (seja despesa ou receita).
 * - Contas marcadas como cartão de crédito (apenas despesas): o período da fatura
 *   vai do dia de fechamento do mês anterior até o dia anterior ao fechamento do
 *   mês atual. Ex: fechamento dia 7 → fatura de março = 7/fev a 6/mar.
 *   Transações no dia de fechamento ou depois caem na fatura do mês seguinte.
 *   Parcelas seguem a mesma lógica.
 * - Receitas em cartão de crédito: usa o mês da data da transação.
 */
export function getMesEfetivo(t: Transacao, contas: ContaItem[]): string {
  const [y, m, d] = t.data.split("-").map(Number);
  const conta = contas.find((c) => c.nome === t.conta);

  if (!conta?.isCartaoCredito || conta.dataFechamento == null) {
    return `${y}-${String(m).padStart(2, "0")}`;
  }
  if (t.valor >= 0) {
    return `${y}-${String(m).padStart(2, "0")}`;
  }

  const diaFechamento = conta.dataFechamento;
  if (d < diaFechamento) {
    return `${y}-${String(m).padStart(2, "0")}`;
  }
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}
