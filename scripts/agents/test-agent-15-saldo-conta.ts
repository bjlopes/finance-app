/**
 * Agent 15 — carry-over de caixa a partir de julho/2026
 *
 * Contas de investimento NÃO entram no saldo acumulado — só aportes/resgates.
 * Cartões de crédito NÃO fazem carry-over (cada mês = fatura do ciclo).
 * Aportes reduzem o saldo da origem e entram no carry-over do mês seguinte.
 * Fatura com conta de pagamento debita no vencimento (fechamento + 7 dias),
 * só depois que essa data chega.
 * Movimentos anteriores a julho/2026 não são recalculados.
 */
import { assert, section, approx, exitCode } from "./_helpers";
import { getMesEfetivo } from "../../src/lib/fluxoCaixa";
import {
  calcularSaldosContaMes,
  migrarContasCartoesPagamento,
  somarSaldoPorContaMes,
} from "../../src/lib/transferencias";
import type { Transacao } from "../../src/types";
import type { ContaItem } from "../../src/context/DataContext";

const contas: ContaItem[] = [
  { id: "1", nome: "Itaú" },
  { id: "2", nome: "Nubank" },
  { id: "3", nome: "Investimentos", isInvestimento: true },
  { id: "4", nome: "Flash alimentação" },
  {
    id: "5",
    nome: "Nubank Ultraviolet",
    isCartaoCredito: true,
    dataFechamento: 7,
    contaPagamentoId: "2",
    diaPagamento: 14,
  },
  {
    id: "6",
    nome: "Cartão Itaú",
    isCartaoCredito: true,
    dataFechamento: 10,
  },
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
  {
    id: "7",
    descricao: "VR",
    valor: 400,
    conta: "Flash alimentação",
    data: "2026-07-01",
    tagIds: [],
  },
  {
    id: "8",
    descricao: "Almoço",
    valor: -50,
    conta: "Flash alimentação",
    data: "2026-07-15",
    tagIds: [],
  },
  {
    id: "9",
    descricao: "Compra UV",
    valor: -800,
    conta: "Nubank Ultraviolet",
    data: "2026-07-03",
    tagIds: [],
  },
  {
    id: "10",
    descricao: "Compra Itaú CC",
    valor: -450,
    conta: "Cartão Itaú",
    data: "2026-07-08",
    tagIds: [],
  },
  {
    id: "11",
    descricao: "Compra UV agosto",
    valor: -500,
    conta: "Nubank Ultraviolet",
    data: "2026-08-03",
    tagIds: [],
  },
];

/** Depois do vencimento de julho (14), antes do de agosto (14). */
const HOJE_ANTES_VENC_AGO = new Date(2026, 7, 7); // 7 ago 2026
const HOJE_NO_VENC_AGO = new Date(2026, 7, 14); // 14 ago 2026

function saldosNoMes(mes: string, contasAtivas: string[], hoje = HOJE_ANTES_VENC_AGO) {
  const transacoesMes = transacoes.filter(
    (t) => getMesEfetivo(t, contas) === mes && contasAtivas.includes(t.conta)
  );
  return calcularSaldosContaMes(
    transacoes,
    transacoesMes,
    contas,
    mes,
    contasAtivas,
    hoje
  );
}

const todas = contas.map((c) => c.nome);

section("Julho é o marco e não recalcula meses anteriores");
const julho = saldosNoMes("2026-07", todas);
assert(approx(julho.saldoInicial["Itaú"] ?? 0, 0), "saldo antigo de junho não entra");
assert(approx(julho.movimentoMes["Itaú"] ?? 0, 2300), "Itaú: 3000 - 200 - 500");
assert(approx(julho.saldoFinal["Itaú"] ?? 0, 2300), "Itaú final = movimento de julho");
assert(approx(julho.saldoFinal["Nubank"] ?? 0, -600), "Nubank: +500 - 300 - 800 fatura UV");
assert(julho.saldoFinal["Investimentos"] === undefined, "investimento sem saldo acumulado");
assert(julho.movimentoMes["Investimentos"] === undefined, "aporte destino não entra no saldo de caixa");
assert(approx(julho.saldoFinal["Flash alimentação"] ?? 0, 350), "Flash acumula no mês");
assert(approx(julho.saldoFinal["Nubank Ultraviolet"] ?? 0, -800), "cartão mostra fatura do mês");
assert(approx(julho.saldoFinal["Cartão Itaú"] ?? 0, -450), "Cartão Itaú sem débito em conta");
assert(
  julho.pagamentosFatura.some((p) => p.cartaoNome === "Nubank Ultraviolet" && p.valor === 800),
  "pagamento UV listado"
);

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
  "2026-07",
  undefined,
  HOJE_ANTES_VENC_AGO
);
assert(approx(saldoManual.saldoFinal["Itaú"] ?? 0, 3300), "saldo manual + movimento do mês");

section("Saldo final de julho vira inicial de agosto (só caixa)");
const agosto = saldosNoMes("2026-08", todas, HOJE_ANTES_VENC_AGO);
assert(approx(agosto.saldoInicial["Itaú"] ?? 0, 2300), "Itaú herda julho");
assert(approx(agosto.saldoInicial["Nubank"] ?? 0, -600), "Nubank herda julho já descontando aporte e UV");
assert(approx(agosto.saldoInicial["Flash alimentação"] ?? 0, 350), "Flash herda julho");
assert(agosto.saldoInicial["Investimentos"] === undefined, "investimento não carrega saldo");
assert(approx(agosto.saldoInicial["Nubank Ultraviolet"] ?? 0, 0), "cartão UV sem carry-over");
assert(approx(agosto.saldoInicial["Cartão Itaú"] ?? 0, 0), "Cartão Itaú sem carry-over");
assert(approx(agosto.saldoFinal["Nubank"] ?? 0, -600), "antes do dia 14 agosto não debita fatura nova");
assert(
  !agosto.pagamentosFatura.some((p) => p.mesFatura === "2026-08"),
  "fatura de agosto ainda não paga em 7/ago"
);

section("No vencimento de agosto a fatura entra na Conta Nubank");
const agostoAposVenc = saldosNoMes("2026-08", todas, HOJE_NO_VENC_AGO);
assert(approx(agostoAposVenc.saldoFinal["Nubank"] ?? 0, -1100), "Nubank: -600 inicial - 500 fatura ago");
assert(
  agostoAposVenc.pagamentosFatura.some((p) => p.mesFatura === "2026-08" && p.valor === 500),
  "pagamento UV de agosto listado no dia 14"
);

section("Total caixa de julho (sem investimento nem cartões)");
const totalCaixa = somarSaldoPorContaMes(julho.saldoFinal, contas, "caixa");
assert(approx(totalCaixa, 2050), "caixa = Itaú 2300 + Nubank -600 + Flash 350");

section("Filtro de conta ativa");
const soItau = saldosNoMes("2026-07", ["Itaú"]);
assert(soItau.saldoFinal["Nubank"] === undefined, "Nubank fora do filtro");
assert(approx(soItau.saldoFinal["Itaú"] ?? 0, 2300), "Itaú isolado no mês");

section("Migração retroativa Ultraviolet → Nubank");
const contasCrua: ContaItem[] = [
  { id: "2", nome: "Conta Nubank" },
  { id: "5", nome: "Nubank Ultraviolet" },
  { id: "6", nome: "Cartão Itaú" },
];
const migradas = migrarContasCartoesPagamento(contasCrua);
const uv = migradas.contas.find((c) => c.nome === "Nubank Ultraviolet")!;
const itauCc = migradas.contas.find((c) => c.nome === "Cartão Itaú")!;
assert(migradas.alteradas === 2, "migra UV e Cartão Itaú");
assert(Boolean(uv.isCartaoCredito), "UV vira cartão");
assert(uv.contaPagamentoId === "2", "UV paga via Conta Nubank");
assert(uv.diaPagamento === 14, "UV dia 14 = fechamento 7 + 7");
assert(uv.dataFechamento === 7, "UV fecha dia 7");
assert(Boolean(itauCc.isCartaoCredito), "Cartão Itaú marcado como CC");
assert(itauCc.contaPagamentoId == null, "Cartão Itaú sem débito automático");

process.exit(exitCode());
