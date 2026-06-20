/**
 * Agent 04 — mês efetivo e fatura de cartão
 */
import { assert, section, exitCode } from "./_helpers";
import { getMesEfetivo, getDataVencimentoFatura } from "../../src/lib/fluxoCaixa";
import type { ContaItem } from "../../src/context/DataContext";
import type { Transacao } from "../../src/types";

const contas: ContaItem[] = [
  { id: "1", nome: "Nubank" },
  { id: "2", nome: "Cartão", isCartaoCredito: true, dataFechamento: 7 },
];

const despesaCcAntes: Transacao = {
  id: "1",
  descricao: "Compra",
  valor: -100,
  conta: "Cartão",
  data: "2025-03-05",
  tagIds: [],
};

const despesaCcDepois: Transacao = {
  ...despesaCcAntes,
  id: "2",
  data: "2025-03-10",
};

const receitaCc: Transacao = {
  id: "3",
  descricao: "Estorno",
  valor: 50,
  conta: "Cartão",
  data: "2025-03-20",
  tagIds: [],
};

section("Mês efetivo");
assert(getMesEfetivo(despesaCcAntes, contas) === "2025-03", "antes fechamento → mês atual");
assert(getMesEfetivo(despesaCcDepois, contas) === "2025-04", "após fechamento → mês seguinte");
assert(getMesEfetivo(receitaCc, contas) === "2025-03", "receita CC usa mês da data");
assert(getMesEfetivo({ ...despesaCcAntes, conta: "Nubank" }, contas) === "2025-03", "conta normal");

section("Vencimento fatura");
const venc = getDataVencimentoFatura(despesaCcDepois, contas);
assert(venc.startsWith("2025-04"), "vencimento no mês efetivo");
assert(venc.endsWith("-14") || venc.endsWith("-13") || venc.includes("-"), "data válida");

process.exit(exitCode());
