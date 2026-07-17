/**
 * Agent 08 — lógica de stats do dashboard (espelho do useMemo)
 */
import { assert, section, approx, exitCode } from "./_helpers";
import { getMesEfetivo } from "../../src/lib/fluxoCaixa";
import {
  isFluxoReal,
  calcularMovimentosInvestimento,
  calcularSaldoMes,
  calcularSaldosContaMes,
  somarSaldoPorContaMes,
  totalReceitasDashboard,
  totalGastosDashboard,
} from "../../src/lib/transferencias";
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
  const gastosFluxo = gastos.reduce((sum, t) => sum + Math.abs(t.valor), 0);
  const receitasFluxo = receitas.reduce((sum, t) => sum + t.valor, 0);

  const gastosPorTagId: Record<string, number> = {};
  gastos.forEach((t) => {
    t.tagIds.forEach((tagId) => {
      gastosPorTagId[tagId] = (gastosPorTagId[tagId] || 0) + Math.abs(t.valor);
    });
  });

  const saldosConta = calcularSaldosContaMes(
    transacoes,
    transacoesMes,
    contas,
    mesSelecionado,
    contasAtivas
  );
  const somaCaixaMes = somarSaldoPorContaMes(saldosConta.saldoFinal, contas, "caixa");

  const investimento = calcularMovimentosInvestimento(
    transacoes,
    contas,
    mesSelecionado,
    (t) => getMesEfetivo(t, contas),
    contasAtivas
  );

  const totalGastos = totalGastosDashboard(gastosFluxo);
  const totalReceitas = totalReceitasDashboard(receitasFluxo);
  const saldo = calcularSaldoMes(totalReceitas, totalGastos);

  return {
    totalGastos,
    totalReceitas,
    gastosFluxo,
    receitasFluxo,
    saldo,
    somaCaixaMes,
    gastosPorTagId,
    saldoInicialPorConta: saldosConta.saldoInicial,
    movimentoPorConta: saldosConta.movimentoMes,
    saldoFinalPorConta: saldosConta.saldoFinal,
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

section("Fluxo do mês = custo de vida (sem aportes/resgates)");
const stats = calcDashboardStats(transacoes, tags, contas, "2025-06", ["Nubank", "Investimentos"]);
assert(approx(stats.receitasFluxo, 5000), "receitas de fluxo = salário");
assert(approx(stats.gastosFluxo, 2050), "gastos de fluxo = uber + aluguel");
assert(approx(stats.totalReceitas, 5000), "receitas = só salário");
assert(approx(stats.totalGastos, 2050), "gastos sem aporte");
assert(approx(stats.saldo, 2950), "saldo = custo de vida (sem aporte)");
assert(approx(stats.somaCaixaMes, 1950), "caixa = nubank após aporte");
assert(approx(stats.receitasFluxo - stats.gastosFluxo, 2950), "fluxo real bate com saldo de vida");
assert(approx(stats.investimento.aportes, 1000), "aporte separado em investimentos");
assert(stats.saldoFinalPorConta["Investimentos"] === undefined, "investimento sem saldo acumulado");

section("Resgate não entra em receitas; fica em Investimentos");
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
assert(approx(comResgate.totalReceitas, 5000), "receitas sem resgate");
assert(approx(comResgate.saldo, 2950), "saldo de custo de vida inalterado pelo resgate");
assert(approx(comResgate.somaCaixaMes, 2250), "caixa final sobe com o resgate");

section("Resgate alto cobre gastos sem poluir o fluxo de vida");
const resgateAlto = calcDashboardStats(
  [
    { id: "a", descricao: "Freela", valor: 1000, conta: "Nubank", data: "2025-06-01", tagIds: [] },
    { id: "b", descricao: "Aluguel", valor: -3000, conta: "Nubank", data: "2025-06-05", tagIds: [] },
    {
      id: "c",
      descricao: "Resgate",
      valor: -5000,
      conta: "Investimentos",
      contaDestino: "Nubank",
      data: "2025-06-10",
      tagIds: [],
      transferenciaId: "tid-x",
    },
    {
      id: "d",
      descricao: "Resgate",
      valor: 5000,
      conta: "Nubank",
      data: "2025-06-10",
      tagIds: [],
      transferenciaId: "tid-x",
    },
  ],
  tags,
  contas,
  "2025-06",
  ["Nubank", "Investimentos"]
);
assert(approx(resgateAlto.receitasFluxo, 1000), "receitas de fluxo < gastos");
assert(approx(resgateAlto.gastosFluxo, 3000), "gastos de fluxo maiores");
assert(approx(resgateAlto.totalReceitas, 1000), "resgate não aparece nas receitas");
assert(approx(resgateAlto.saldo, -2000), "saldo de vida = 1000 − 3000");
assert(approx(resgateAlto.investimento.resgates, 5000), "resgate só em investimentos");
assert(approx(resgateAlto.somaCaixaMes, 3000), "caixa final com resgate");

section("Saldo por conta de caixa inclui aporte (sem saldo de investimento)");
assert(approx(stats.saldoFinalPorConta["Nubank"] ?? 0, 1950), "nubank: 5000-50-2000-1000");
assert(stats.saldoFinalPorConta["Investimentos"] === undefined, "investimento fora do saldo por conta");

section("Tags");
assert(approx(stats.gastosPorTagId["t1"] ?? 0, 50), "gasto transporte");
assert(approx(stats.gastosPorTagId["t2"] ?? 0, 2000), "gasto casa");
assert(stats.tagHierarchy.length === 2, "hierarquia de tags");

section("Antes do marco não há carry-over retroativo");
const comSaldoManualJunho = calcDashboardStats(
  [
    { id: "m1", descricao: "Saldo inicial manual", valor: 8000, conta: "Nubank", data: "2025-06-01", tagIds: [] },
    ...transacoes,
  ],
  tags,
  contas,
  "2025-06",
  ["Nubank", "Investimentos"]
);
assert(approx(comSaldoManualJunho.saldoInicialPorConta["Nubank"] ?? 0, 0), "sem saldo inicial antes do marco");
assert(approx(comSaldoManualJunho.movimentoPorConta["Nubank"] ?? 0, 9950), "saldo manual entra como transação do mês");
assert(approx(comSaldoManualJunho.saldoFinalPorConta["Nubank"] ?? 0, 9950), "saldo da conta considera lançamentos manuais do mês");
assert(approx(comSaldoManualJunho.somaCaixaMes, 9950), "caixa inclui saldo manual do mês");

const julhoSemMov = calcDashboardStats(
  [
    { id: "m1", descricao: "Saldo inicial manual", valor: 8000, conta: "Nubank", data: "2025-06-01", tagIds: [] },
    ...transacoes,
  ],
  tags,
  contas,
  "2025-07",
  ["Nubank", "Investimentos"]
);
assert(approx(julhoSemMov.saldoInicialPorConta["Nubank"] ?? 0, 0), "período anterior ao marco não gera carry-over");
assert(julhoSemMov.saldoInicialPorConta["Investimentos"] === undefined, "aporte não cria saldo em investimentos");
assert(julhoSemMov.saldoFinalPorConta["Nubank"] === undefined, "julho sem lançamento manual não herda saldo");

section("Investimentos");
assert(approx(stats.investimento.aportes, 1000), "aportes no mês");
assert(stats.investimento.qtdAportes === 1, "1 aporte");
assert(comResgate.investimento.transacoesResgate.length === 1, "lista de resgates");
assert(comResgate.investimento.transacoesAporte.length === 1, "lista de aportes");

section("Filtro de contas ativas");
const soNubank = calcDashboardStats(transacoes, tags, contas, "2025-06", ["Nubank"]);
assert(soNubank.saldoFinalPorConta["Investimentos"] === undefined, "conta inativa some do saldo");
assert(approx(soNubank.totalReceitas, 5000), "receitas só da conta selecionada");
assert(approx(soNubank.totalGastos, 2050), "gastos sem aporte no fluxo");
assert(approx(soNubank.investimento.aportes, 1000), "aporte ainda aparece em investimentos");

const soInvestimentos = calcDashboardStats(transacoes, tags, contas, "2025-06", ["Investimentos"]);
assert(approx(soInvestimentos.totalReceitas, 0), "salário em outra conta não entra nas receitas");
assert(approx(soInvestimentos.totalGastos, 0), "gastos de outra conta não entram");
assert(approx(soInvestimentos.investimento.aportes, 0), "aporte de conta fora da seleção não conta");
assert(approx(soInvestimentos.investimento.resgates, 0), "resgate para conta fora da seleção não conta");

const soNubankComResgate = calcDashboardStats(
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
  ["Nubank"]
);
assert(approx(soNubankComResgate.investimento.resgates, 300), "resgate para conta ativa conta");
assert(approx(soNubankComResgate.totalReceitas, 5000), "receitas sem resgate");
assert(approx(soNubankComResgate.saldo, 2950), "saldo de custo de vida coerente");
assert(approx(soNubankComResgate.somaCaixaMes, 2250), "caixa final com resgate");

process.exit(exitCode());
