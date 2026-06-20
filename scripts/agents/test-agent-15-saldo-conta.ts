/**
 * Agent 15 — saldo por conta com transferências
 */
import { assert, section, approx, exitCode } from "./_helpers";
import { getMesEfetivo } from "../../src/lib/fluxoCaixa";
import type { Transacao } from "../../src/types";
import type { ContaItem } from "../../src/context/DataContext";

function saldoPorContaNoMes(
  transacoes: Transacao[],
  contas: ContaItem[],
  mes: string,
  contasAtivas: string[]
): Record<string, number> {
  let transacoesMes = transacoes.filter((t) => getMesEfetivo(t, contas) === mes);
  transacoesMes = transacoesMes.filter((t) => contasAtivas.includes(t.conta));
  const saldo: Record<string, number> = {};
  transacoesMes.forEach((t) => {
    saldo[t.conta] = (saldo[t.conta] || 0) + t.valor;
  });
  return saldo;
}

const contas: ContaItem[] = [
  { id: "1", nome: "Itaú" },
  { id: "2", nome: "Nubank" },
  { id: "3", nome: "Investimentos", isInvestimento: true },
];

const transacoes: Transacao[] = [
  { id: "1", descricao: "Salário", valor: 3000, conta: "Itaú", data: "2025-06-01", tagIds: [] },
  { id: "2", descricao: "Mercado", valor: -200, conta: "Itaú", data: "2025-06-05", tagIds: [] },
  {
    id: "3",
    descricao: "Pix",
    valor: -500,
    conta: "Itaú",
    contaDestino: "Nubank",
    data: "2025-06-10",
    tagIds: [],
    transferenciaId: "t1",
  },
  {
    id: "4",
    descricao: "Pix",
    valor: 500,
    conta: "Nubank",
    data: "2025-06-10",
    tagIds: [],
    transferenciaId: "t1",
  },
  {
    id: "5",
    descricao: "Aporte",
    valor: -300,
    conta: "Nubank",
    contaDestino: "Investimentos",
    data: "2025-06-12",
    tagIds: [],
    transferenciaId: "t2",
  },
  {
    id: "6",
    descricao: "Aporte",
    valor: 300,
    conta: "Investimentos",
    data: "2025-06-12",
    tagIds: [],
    transferenciaId: "t2",
  },
];

section("Transferências movem saldo entre contas");
const saldo = saldoPorContaNoMes(transacoes, contas, "2025-06", ["Itaú", "Nubank", "Investimentos"]);
assert(approx(saldo["Itaú"] ?? 0, 2300), "Itaú: 3000 - 200 - 500");
assert(approx(saldo["Nubank"] ?? 0, 200), "Nubank: +500 - 300");
assert(approx(saldo["Investimentos"] ?? 0, 300), "Investimentos: +300");

section("Soma total preservada");
const total = Object.values(saldo).reduce((a, b) => a + b, 0);
assert(approx(total, 2800), "total líquido = 3000 - 200");

section("Filtro de conta ativa");
const soItau = saldoPorContaNoMes(transacoes, contas, "2025-06", ["Itaú"]);
assert(soItau["Nubank"] === undefined, "Nubank fora do filtro");
assert(approx(soItau["Itaú"] ?? 0, 2300), "Itaú isolado");

process.exit(exitCode());
