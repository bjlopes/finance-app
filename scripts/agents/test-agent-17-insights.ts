/**
 * Agent 17 — insights de custo de vida (mediana + outliers)
 */
import { assert, approx, exitCode, section } from "./_helpers";
import { calcularInsightsFinanceiros } from "../../src/lib/insights";
import type { ContaItem } from "../../src/context/DataContext";
import type { Tag, Transacao } from "../../src/types";

const contas: ContaItem[] = [
  { id: "c1", nome: "Nubank" },
  { id: "c2", nome: "Investimentos", isInvestimento: true },
];

const tags: Tag[] = [
  { id: "casa", nome: "casa", cor: "#8b5cf6" },
  { id: "alimentacao", nome: "alimentação", cor: "#f59e0b" },
  { id: "pontual", nome: "pontual", cor: "#64748b" },
  { id: "invest", nome: "investimentos", cor: "#22c55e" },
  { id: "internas", nome: "transações internas", cor: "#64748b" },
];

const transacoes: Transacao[] = [];
for (let mes = 1; mes <= 6; mes++) {
  const ym = `2026-${String(mes).padStart(2, "0")}`;
  transacoes.push(
    {
      id: `sal-${mes}`,
      descricao: "Salário",
      valor: 5000,
      conta: "Nubank",
      data: `${ym}-01`,
      tagIds: [],
    },
    {
      id: `alug-${mes}`,
      descricao: "Aluguel",
      valor: -2000,
      conta: "Nubank",
      data: `${ym}-05`,
      tagIds: ["casa"],
      recorrente: true,
    },
    {
      id: `merc-${mes}`,
      descricao: "Mercado",
      valor: -500,
      conta: "Nubank",
      data: `${ym}-10`,
      tagIds: ["alimentacao"],
    }
  );
}

transacoes.push(
  {
    id: "bonus",
    descricao: "Bônus anual",
    valor: 10000,
    conta: "Nubank",
    data: "2026-03-01",
    tagIds: [],
  },
  {
    id: "adiantamento",
    descricao: "Adiantamento de salário",
    valor: 9000,
    conta: "Nubank",
    data: "2026-04-01",
    tagIds: [],
  },
  {
    id: "loan",
    descricao: "Quitação empréstimo",
    valor: -10000,
    conta: "Nubank",
    data: "2026-03-15",
    tagIds: ["pontual"],
  },
  {
    id: "aporte",
    descricao: "Aporte",
    valor: -3000,
    conta: "Nubank",
    data: "2026-04-20",
    tagIds: ["invest"],
  },
  {
    id: "interna",
    descricao: "Movimento interno",
    valor: -1500,
    conta: "Nubank",
    data: "2026-05-20",
    tagIds: ["internas"],
  },
  {
    id: "jul-alug",
    descricao: "Aluguel",
    valor: -2000,
    conta: "Nubank",
    data: "2026-07-05",
    tagIds: ["casa"],
    recorrente: true,
  },
  {
    id: "jul-merc",
    descricao: "Mercado",
    valor: -600,
    conta: "Nubank",
    data: "2026-07-10",
    tagIds: ["alimentacao"],
  },
  {
    id: "jul-extra",
    descricao: "Cirurgia pontual",
    valor: -5000,
    conta: "Nubank",
    data: "2026-07-12",
    tagIds: [],
  }
);

const insights = calcularInsightsFinanceiros(
  transacoes,
  tags,
  contas,
  "2026-07"
);

section("Custo de vida típico");
assert(insights.mesesBase.length === 6, "usa seis meses");
assert(approx(insights.custoVidaTipico, 2500), "mediana sem empréstimo");
assert(approx(insights.receitaTipica, 5000), "receita típica");
assert(approx(insights.sobraTipica, 2500), "folga típica");
assert(approx(insights.taxaPoupancaTipica ?? 0, 50), "taxa de folga");
assert(insights.confianca === "alta", "confiança alta");

section("Exclusões");
assert(insights.pontuaisExcluidos.some((p) => p.id === "loan"), "empréstimo excluído");
assert(
  insights.pontuaisExcluidos.some((p) => p.id === "bonus" && p.tipo === "entrada"),
  "bônus excluído da receita típica"
);
assert(
  !insights.pontuaisExcluidos.some((p) => p.id === "adiantamento"),
  "adiantamento de salário não é outlier"
);
assert(!insights.pontuaisExcluidos.some((p) => p.id === "aporte"), "aporte nem entra na base");
assert(!insights.pontuaisExcluidos.some((p) => p.id === "interna"), "interna nem entra na base");

section("Mês atual");
assert(approx(insights.gastoAtual, 7600), "gasto real inclui pontual");
assert(insights.pontuaisDoMes.some((p) => p.id === "jul-extra"), "outlier atual detectado");
assert(insights.categorias.some((c) => c.nome === "casa"), "categoria casa");
assert(insights.mensagens.length > 0, "gera leitura textual");

process.exit(exitCode());
