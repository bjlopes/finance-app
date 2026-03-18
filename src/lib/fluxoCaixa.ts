import type { Transacao } from "@/types";
import type { ContaItem } from "@/context/DataContext";

const DIAS_APOS_FECHAMENTO = 7;

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
  const [y, m] = mesEfetivo.split("-").map(Number);
  const diaFechamento = conta.dataFechamento;
  const dataFechamento = new Date(y, m - 1, diaFechamento);
  dataFechamento.setDate(dataFechamento.getDate() + DIAS_APOS_FECHAMENTO);
  const yy = dataFechamento.getFullYear();
  const mm = String(dataFechamento.getMonth() + 1).padStart(2, "0");
  const dd = String(dataFechamento.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Retorna o mês efetivo para fluxo de caixa.
 * - Contas NÃO marcadas como cartão de crédito: usa o mês da data da transação
 *   (seja despesa ou receita).
 * - Contas marcadas como cartão de crédito (apenas despesas): transações após o
 *   dia de fechamento caem no mês seguinte (vencimento da fatura).
 *   Parcelas seguem a mesma lógica; a data da transação (ex: 14/03) permanece
 *   inalterada, mas o gasto entra no mês da fatura.
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
  if (d <= diaFechamento) {
    return `${y}-${String(m).padStart(2, "0")}`;
  }
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}
