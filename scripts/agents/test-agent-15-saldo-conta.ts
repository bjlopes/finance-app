/**
 * Agent 15 — carry-over de caixa a partir de julho/2026
 *
 * Contas de investimento NÃO entram no saldo acumulado — só aportes/resgates.
 * Aportes reduzem o saldo da origem e entram no carry-over do mês seguinte.
 * Movimentos anteriores a julho/2026 não são recalculados.
 */
import { assert, section, approx, exitCode } from "./_helpers";
import { getMesEfetivo } from "../../src/lib/fluxoCaixa";
import { calcularSaldosContaMes } from "../../src/lib/transferencias";
import type { Transacao } from "../../src/types";
import type { ContaItem } from "../../src/context/DataContext";

const contas: ContaItem[] = [
  { id: "1", nome: "Itaú" },
  { id: "2", nome: "Nubank" },
  { id: "3", nome: "Investimentos", isInvestimento: true },
];

const transacoes: Transacao[] = [
  { id: "0", descricao: "Saldo antigo", valor: 9000, conta: "Itaú", data: "2026-06-28", tagIds: [] },
  { id: "1", descricao: "Salário", valor: 3000, conta: "Itaú", data: "2026-07-01", tagIds: [] },
  { id: "2", descricao: "Mercado", valor: -200, conta: "Itaú", data: "2026-07-05", tagIds: [] },
  {
    id: "3",
    descricao: "Pix",
    valor: -500,
    conta: "Itaú",
    contaDestino: "Nubank",
    data: "2026-07-10",
    tagIds: [],
    transferenciaId: "t1",
  },
  {
    id: "4",
    descricao: "Pix",
    valor: 500,
    conta: "Nubank",
    data: "2026-07-10",
    tagIds: [],
    transferenciaId: "t1",
  },
  {
    id: "5",
    descricao: "Aporte",
    valor: -300,
    conta: "Nubank",
    contaDestino: "Investimentos",
    data: "2026-07-12",
    tagIds: [],
    transferenciaId: "t2",
  },
  {
    id: "6",
    descricao: "Aporte",
    valor: 300,
    conta: "Investimentos",
    data: "2026-07-12",
    tagIds: [],
    transferenciaId: "t2",
  },
];

function saldosNoMes(mes: string, contasAtivas: string[]) {
  const transacoesMes = transacoes.filter(
    (t) => getMesEfetivo(t, contas) === mes && contasAtivas.includes(t.conta)
  );
  return calcularSaldosContaMes(transacoes, transacoesMes, contas, mes, contasAtivas);
}

section("Julho é o marco e não recalcula meses anteriores");
const julho = saldosNoMes("2026-07", ["Itaú", "Nubank", "Investimentos"]);
assert(approx(julho.saldoInicial["Itaú"] ?? 0, 0), "saldo antigo de junho não entra");
assert(approx(julho.movimentoMes["Itaú"] ?? 0, 2300), "Itaú: 3000 - 200 - 500");
assert(approx(julho.saldoFinal["Itaú"] ?? 0, 2300), "Itaú final = movimento de julho");
assert(approx(julho.saldoFinal["Nubank"] ?? 0, 200), "Nubank: +500 - 300 (aporte)");
assert(julho.saldoFinal["Investimentos"] === undefined, "investimento sem saldo acumulado");
assert(julho.movimentoMes["Investimentos"] === undefined, "aporte destino não entra no saldo de caixa");

section("Saldo manual deve ser lançado no próprio mês");
const julhoComSaldoManual: Transacao[] = [
  { id: "manual", descricao: "Saldo inicial manual", valor: 1000, conta: "Itaú", data: "2026-07-01", tagIds: [] },
  ...transacoes,
];
const transacoesJulhoComSaldo = julhoComSaldoManual.filter(
  (t) => getMesEfetivo(t, contas) === "2026-07"
);
const saldoManual = calcularSaldosContaMes(
  julhoComSaldoManual,
  transacoesJulhoComSaldo,
  contas,
  "2026-07"
);
assert(approx(saldoManual.saldoFinal["Itaú"] ?? 0, 3300), "saldo manual + movimento do mês");

section("Saldo final de julho vira inicial de agosto");
const agosto = saldosNoMes("2026-08", ["Itaú", "Nubank", "Investimentos"]);
assert(approx(agosto.saldoInicial["Itaú"] ?? 0, 2300), "Itaú herda julho");
assert(approx(agosto.saldoInicial["Nubank"] ?? 0, 200), "Nubank herda julho já descontando aporte");
assert(agosto.saldoInicial["Investimentos"] === undefined, "investimento não carrega saldo");
assert(approx(agosto.saldoFinal["Nubank"] ?? 0, 200), "agosto sem movimento mantém Nubank");

section("Total caixa de julho (sem investimento)");
const totalCaixa = Object.values(julho.saldoFinal).reduce((a, b) => a + b, 0);
assert(approx(totalCaixa, 2500), "caixa = 3000 - 200 - 300 aporte");

section("Filtro de conta ativa");
const soItau = saldosNoMes("2026-07", ["Itaú"]);
assert(soItau.saldoFinal["Nubank"] === undefined, "Nubank fora do filtro");
assert(approx(soItau.saldoFinal["Itaú"] ?? 0, 2300), "Itaú isolado no mês");

process.exit(exitCode());
