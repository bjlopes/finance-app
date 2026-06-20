/**
 * Agent 08 — lógica de stats do dashboard (espelho do useMemo)
 */
import { assert, section, approx, exitCode } from "./_helpers";
import { getMesEfetivo } from "../../src/lib/fluxoCaixa";
import { isFluxoReal, calcularMovimentosInvestimento, calcularSaldoFluxoMes } from "../../src/lib/transferencias";
import { buildTagSpendingHierarchy } from "../../src/lib/tags-utils";
import type { Transacao, Tag } from "../../src/types";
import type { ContaItem } from "../../src/context/DataContext";

function calcDashboardStats(
  transacoes: Transacao[],
  tags: Tag[],
  contas: ContaItem[],
  mesSelecionado: string,
  contasAtivas: string[]
) {
  let transacoesMes = transacoes.filter(
    (t) => getMesEfetivo(t, contas) === mesSelecionado
  );
  transacoesMes = transacoesMes.filter((t) => contasAtivas.includes(t.conta));

  const gastos = transacoesMes.filter((t) => t.valor < 0 && isFluxoReal(t));
  const receitas = transacoesMes.filter((t) => t.valor > 0 && isFluxoReal(t));
  const totalGastos = gastos.reduce((sum, t) => sum + Math.abs(t.valor), 0);
  const totalReceitas = receitas.reduce((sum, t) => sum + t.valor, 0);

  const gastosPorTagId: Record<string, number> = {};
  gastos.forEach((t) => {
    t.tagIds.forEach((tagId) => {
      gastosPorTagId[tagId] = (gastosPorTagId[tagId] || 0) + Math.abs(t.valor);
    });
  });

  const saldoPorConta: Record<string, number> = {};
  transacoesMes.forEach((t) => {
    saldoPorConta[t.conta] = (saldoPorConta[t.conta] || 0) + t.valor;
  });

  const investimento = calcularMovimentosInvestimento(
    transacoes,
    contas,
    mesSelecionado,
    (t) => getMesEfetivo(t, contas)
  );

  const saldo = calcularSaldoFluxoMes(totalReceitas, totalGastos, investimento);

  return {
    totalGastos,
    totalReceitas,
    saldo,
    gastosPorTagId,
    saldoPorConta,
    tagHierarchy: buildTagSpendingHierarchy(tags, gastosPorTagId),
    investimento,
  };
}

const contas: ContaItem[] = [
  { id: "1", nome: "Nubank" },
  { id: "2", nome: "Investimentos", isInvestimento: true },
];

const tags: Tag[] = [
  { id: "t1", nome: "transporte", cor: "#3b82f6" },
  { id: "t2", nome: "casa", cor: "#8b5cf6" },
];

const transacoes: Transacao[] = [
  { id: "1", descricao: "Salário", valor: 5000, conta: "Nubank", data: "2025-06-05", tagIds: [] },
  { id: "2", descricao: "Uber", valor: -50, conta: "Nubank", data: "2025-06-10", tagIds: ["t1"] },
  { id: "3", descricao: "Aluguel", valor: -2000, conta: "Nubank", data: "2025-06-01", tagIds: ["t2"] },
  {
    id: "4",
    descricao: "Pix invest",
    valor: -1000,
    conta: "Nubank",
    contaDestino: "Investimentos",
    data: "2025-06-15",
    tagIds: [],
    transferenciaId: "tid-1",
  },
  {
    id: "5",
    descricao: "Pix invest",
    valor: 1000,
    conta: "Investimentos",
    data: "2025-06-15",
    tagIds: [],
    transferenciaId: "tid-1",
  },
];

section("Receitas e gastos excluem transferência");
const stats = calcDashboardStats(transacoes, tags, contas, "2025-06", ["Nubank", "Investimentos"]);
assert(approx(stats.totalReceitas, 5000), "receitas = salário");
assert(approx(stats.totalGastos, 2050), "gastos = uber + aluguel (sem transferência)");
assert(approx(stats.saldo, 1950), "saldo = receitas - gastos - aporte");

section("Resgate impacta saldo positivamente");
const comResgate = calcDashboardStats(
  [
    ...transacoes,
    {
      id: "6",
      descricao: "Resgate CDB",
      valor: -300,
      conta: "Investimentos",
      contaDestino: "Nubank",
      data: "2025-06-20",
      tagIds: [],
      transferenciaId: "tid-r",
    },
    {
      id: "7",
      descricao: "Resgate CDB",
      valor: 300,
      conta: "Nubank",
      data: "2025-06-20",
      tagIds: [],
      transferenciaId: "tid-r",
    },
  ],
  tags,
  contas,
  "2025-06",
  ["Nubank", "Investimentos"]
);
assert(approx(comResgate.investimento.resgates, 300), "resgate contabilizado");
assert(approx(comResgate.saldo, 2250), "saldo + resgate: 1950+300");

section("Tags");
assert(approx(stats.gastosPorTagId["t1"] ?? 0, 50), "gasto transporte");
assert(approx(stats.gastosPorTagId["t2"] ?? 0, 2000), "gasto casa");
assert(stats.tagHierarchy.length === 2, "hierarquia de tags");

section("Saldo por conta inclui transferência");
assert(approx(stats.saldoPorConta["Nubank"] ?? 0, 1950), "nubank: 5000-50-2000-1000");
assert(approx(stats.saldoPorConta["Investimentos"] ?? 0, 1000), "investimentos +1000");

section("Investimentos");
assert(approx(stats.investimento.aportes, 1000), "aportes no mês");
assert(stats.investimento.qtdAportes === 1, "1 aporte");

section("Filtro de contas ativas");
const soNubank = calcDashboardStats(transacoes, tags, contas, "2025-06", ["Nubank"]);
assert(soNubank.saldoPorConta["Investimentos"] === undefined, "conta inativa some do saldo");

process.exit(exitCode());
