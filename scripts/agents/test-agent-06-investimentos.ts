/**
 * Agent 06 — aportes e resgates (conta investimento)
 */
import { assert, section, exitCode } from "./_helpers";
import {
  calcularMovimentosInvestimento,
  isContaInvestimento,
} from "../../src/lib/transferencias";
import type { Transacao } from "../../src/types";
import type { ContaItem } from "../../src/context/DataContext";

const contas: ContaItem[] = [
  { id: "c1", nome: "Nubank" },
  { id: "c2", nome: "Investimentos", isInvestimento: true },
];

const aporteOrigem: Transacao = {
  id: "a1",
  descricao: "Aporte CDB",
  valor: -1000,
  conta: "Nubank",
  contaDestino: "Investimentos",
  data: "2025-06-15",
  tagIds: [],
  transferenciaId: "tid-a",
};

const aporteDestino: Transacao = {
  ...aporteOrigem,
  id: "a2",
  valor: 1000,
  conta: "Investimentos",
};

const resgateOrigem: Transacao = {
  id: "r1",
  descricao: "Resgate",
  valor: -300,
  conta: "Investimentos",
  contaDestino: "Nubank",
  data: "2025-06-20",
  tagIds: [],
  transferenciaId: "tid-r",
};

section("Conta investimento");
assert(isContaInvestimento("Investimentos", contas), "flag investimento");
assert(!isContaInvestimento("Nubank", contas), "nubank não é investimento");

section("Movimentos do mês");
const mov = calcularMovimentosInvestimento(
  [aporteOrigem, aporteDestino, resgateOrigem],
  contas,
  "2025-06",
  (t) => t.data.slice(0, 7)
);
assert(mov.aportes === 1000, "aportes");
assert(mov.resgates === 300, "resgates");
assert(mov.qtdAportes === 1, "qtd aportes");
assert(mov.qtdResgates === 1, "qtd resgates");

process.exit(exitCode());
