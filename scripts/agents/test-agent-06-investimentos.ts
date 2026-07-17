/**
 * Agent 06 — aportes e resgates (conta investimento)
 */
import { assert, section, exitCode } from "./_helpers";
import {
  calcularMovimentosInvestimento,
  calcularSaldoMes,
  totalReceitasDashboard,
  totalGastosDashboard,
  isContaInvestimento,
} from "../../src/lib/transferencias";
import type { Transacao } from "../../src/types";
import type { Tag } from "../../src/types";
import type { ContaItem } from "../../src/context/DataContext";

const contas: ContaItem[] = [
  { id: "c1", nome: "Nubank" },
  { id: "c2", nome: "Investimentos", isInvestimento: true },
];

const tags: Tag[] = [
  { id: "tag-invest", nome: "investimentos", cor: "#22c55e" },
  { id: "tag-cdb", nome: "CDB", parentId: "tag-invest", cor: "#22c55e" },
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

section("Filtro por contas ativas");
const soNubank = calcularMovimentosInvestimento(
  [aporteOrigem, aporteDestino, resgateOrigem],
  contas,
  "2025-06",
  (t) => t.data.slice(0, 7),
  ["Nubank"]
);
assert(soNubank.aportes === 1000, "aporte com origem ativa");
assert(soNubank.resgates === 300, "resgate com destino ativo");

const soInvestimentos = calcularMovimentosInvestimento(
  [aporteOrigem, aporteDestino, resgateOrigem],
  contas,
  "2025-06",
  (t) => t.data.slice(0, 7),
  ["Investimentos"]
);
assert(soInvestimentos.aportes === 0, "aporte sem origem ativa não conta");
assert(soInvestimentos.resgates === 0, "resgate sem destino ativo não conta");

section("Tag investimento");
const aportePorTag: Transacao = {
  id: "tag-a",
  descricao: "CDB antigo",
  valor: -700,
  conta: "Nubank",
  data: "2025-06-12",
  tagIds: ["tag-cdb"],
};
const resgatePorTag: Transacao = {
  id: "tag-r",
  descricao: "Resgate antigo",
  valor: 200,
  conta: "Nubank",
  data: "2025-06-22",
  tagIds: ["tag-invest"],
};
const movTag = calcularMovimentosInvestimento(
  [aportePorTag, resgatePorTag],
  contas,
  "2025-06",
  (t) => t.data.slice(0, 7),
  ["Nubank"],
  tags
);
assert(movTag.aportes === 700, "aporte por tag/subtag investimento");
assert(movTag.resgates === 200, "resgate por tag investimento");
assert(movTag.transacoesAporte.length === 1, "transação de aporte por tag listada");
assert(movTag.transacoesResgate.length === 1, "transação de resgate por tag listada");

section("Saldo do mês sem misturar investimentos");
const receitasFluxo = 5000;
const gastosFluxo = 2050;
assert(calcularSaldoMes(5000, 2050) === 2950, "saldo = receitas − gastos");
assert(
  calcularSaldoMes(
    totalReceitasDashboard(receitasFluxo),
    totalGastosDashboard(gastosFluxo)
  ) === 5000 - 2050,
  "aportes/resgates não entram no saldo de custo de vida"
);
assert(mov.aportes === 1000, "aporte ainda contabilizado em investimentos");
assert(mov.resgates === 300, "resgate ainda contabilizado em investimentos");
assert(mov.transacoesResgate.length === 1, "transação de resgate listada");
assert(mov.transacoesAporte.length === 1, "transação de aporte listada");

process.exit(exitCode());
