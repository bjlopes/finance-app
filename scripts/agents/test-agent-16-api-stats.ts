/**
 * Agent 16 — calcMesStats (API /api/stats + dashboard)
 */
import { assert, section, approx, exitCode } from "./_helpers";
import { calcMesStats } from "../../src/lib/stats";
import type { Transacao, Tag } from "../../src/types";
import type { ContaItem } from "../../src/context/DataContext";

const mes = "2025-03";
const contas: ContaItem[] = [
  { id: "1", nome: "Nubank" },
  { id: "2", nome: "Cartão", isCartaoCredito: true, dataFechamento: 7 },
];

const tags: Tag[] = [
  { id: "t1", nome: "alimentação", cor: "#f59e0b" },
  { id: "t-invest", nome: "investimentos", cor: "#22c55e" },
];

const transacoes: Transacao[] = [
  { id: "1", descricao: "Salário", valor: 4000, conta: "Nubank", data: "2025-03-01", tagIds: [] },
  { id: "2", descricao: "Almoço", valor: -35, conta: "Nubank", data: "2025-03-03", tagIds: ["t1"] },
  {
    id: "3",
    descricao: "Pix invest",
    valor: -800,
    conta: "Nubank",
    contaDestino: "Investimentos",
    data: "2025-03-10",
    tagIds: [],
    transferenciaId: "tid",
  },
  {
    id: "4",
    descricao: "Pix invest",
    valor: 800,
    conta: "Investimentos",
    data: "2025-03-10",
    tagIds: [],
    transferenciaId: "tid",
  },
  /** Compra CC após fechamento → mês efetivo abril; não entra em março */
  {
    id: "5",
    descricao: "Loja",
    valor: -200,
    conta: "Cartão",
    data: "2025-03-10",
    tagIds: [],
  },
  { id: "6", descricao: "Freelance", valor: 500, conta: "Nubank", data: "2025-02-28", tagIds: [] },
  { id: "7", descricao: "Aporte antigo", valor: -900, conta: "Nubank", data: "2025-03-12", tagIds: ["t-invest"] },
  { id: "8", descricao: "Resgate antigo", valor: 300, conta: "Nubank", data: "2025-03-20", tagIds: ["t-invest"] },
];

section("Stats do mês (getMesEfetivo)");
const stats = calcMesStats(transacoes, tags, contas, mes);
assert(approx(stats.totalReceitasMes, 4000), "receitas sem transferência/investimento por tag");
assert(approx(stats.totalGastosMes, 35), "gastos sem transferência, tag investimento e CC de abril");
assert(approx(stats.saldoMes, 3965), "saldo = receitas - gastos");
assert(stats.totalTransacoes === 8, "conta todas transações");

section("Cartão: compra após fechamento vai para mês seguinte");
const abril = calcMesStats(transacoes, tags, contas, "2025-04");
assert(approx(abril.totalGastosMes, 200), "compra CC 10/mar no mês efetivo abril");

section("Transferência não infla gastos");
const comTransferComoGasto = transacoes
  .filter((t) => t.data.startsWith(mes) && t.valor < 0)
  .reduce((s, t) => s + Math.abs(t.valor), 0);
assert(comTransferComoGasto > stats.totalGastosMes, "sem isFluxoReal contaria transferência");

section("Mês sem dados");
const vazio = calcMesStats([], [], contas, mes);
assert(approx(vazio.totalGastosMes, 0), "gastos zero");
assert(approx(vazio.totalReceitasMes, 0), "receitas zero");

process.exit(exitCode());
