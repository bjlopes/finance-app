import type { Transacao } from "@/types";
import type { ContaItem } from "@/context/DataContext";

/**
 * Retorna o mês efetivo para fluxo de caixa.
 * - Contas NÃO marcadas como cartão de crédito: usa o mês da data da transação
 *   (seja despesa ou receita).
 * - Contas marcadas como cartão de crédito (apenas despesas): transações após o
 *   dia de fechamento caem no mês seguinte (vencimento da fatura).
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
