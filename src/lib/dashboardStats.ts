import { getMesEfetivo } from "@/lib/fluxoCaixa";
import {
  isFluxoReal,
  isTransacaoInvestimento,
  isTransacaoProjeto,
  hasTagTransacoesInternas,
  calcularMovimentosInvestimento,
  calcularMovimentosProjeto,
  calcularSaldoMes,
  calcularSaldosContaMes,
  somarSaldoPorContaMes,
  totalReceitasDashboard,
  totalGastosDashboard,
  type MovimentosInvestimento,
  type MovimentosProjeto,
  type MovimentosProjetoConta,
  type PagamentoFaturaMes,
} from "@/lib/transferencias";
import { buildTagSpendingHierarchy, type TagSpendingNode } from "@/lib/tags-utils";
import type { ContaItem } from "@/context/DataContext";
import type { Transacao, Tag } from "@/types";

export type DashboardPeriodo = "mes" | "ytd";

export const MESES_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const MESES_CURTO = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export interface MesBreakdownItem {
  mesYm: string;
  mesCurto: string;
  gastos: number;
  receitas: number;
  saldo: number;
}

export interface DashboardStats {
  periodo: DashboardPeriodo;
  mesesNoPeriodo: string[];
  mesLabel: string;
  /** Mês de referência do picker (fim do YTD / mês ativo). */
  mesReferencia: string;
  totalGastosMes: number;
  totalReceitasMes: number;
  gastosFluxo: number;
  receitasFluxo: number;
  saldoMes: number;
  somaCaixaMes: number;
  saldoInicialPorConta: Record<string, number>;
  movimentoPorConta: Record<string, number>;
  saldoFinalPorConta: Record<string, number>;
  pagamentosFatura: PagamentoFaturaMes[];
  tagHierarchy: TagSpendingNode[];
  gastosPorTagId: Record<string, number>;
  gastos: Transacao[];
  receitas: Transacao[];
  topContas: [string, number][];
  maioresGastos: Transacao[];
  qtdTransacoesMes: number;
  qtdGastos: number;
  qtdReceitas: number;
  totalTransacoes: number;
  temContaInvestimento: boolean;
  investimento: MovimentosInvestimento;
  temContaProjeto: boolean;
  projeto: MovimentosProjeto;
  /** Só preenchido em YTD — fluxo de vida por mês no intervalo. */
  breakdownMensal: MesBreakdownItem[];
}

function emptyInvestimento(): MovimentosInvestimento {
  return {
    aportes: 0,
    resgates: 0,
    qtdAportes: 0,
    qtdResgates: 0,
    transacoesAporte: [],
    transacoesResgate: [],
  };
}

function emptyProjeto(): MovimentosProjeto {
  return {
    entradas: 0,
    saidas: 0,
    liquido: 0,
    qtdEntradas: 0,
    qtdSaidas: 0,
    porConta: [],
    transacoesEntrada: [],
    transacoesSaida: [],
  };
}

function somarInvestimento(
  partes: MovimentosInvestimento[]
): MovimentosInvestimento {
  if (partes.length === 0) return emptyInvestimento();
  if (partes.length === 1) return partes[0];
  return {
    aportes: partes.reduce((s, p) => s + p.aportes, 0),
    resgates: partes.reduce((s, p) => s + p.resgates, 0),
    qtdAportes: partes.reduce((s, p) => s + p.qtdAportes, 0),
    qtdResgates: partes.reduce((s, p) => s + p.qtdResgates, 0),
    transacoesAporte: partes.flatMap((p) => p.transacoesAporte),
    transacoesResgate: partes.flatMap((p) => p.transacoesResgate),
  };
}

function somarProjeto(partes: MovimentosProjeto[]): MovimentosProjeto {
  if (partes.length === 0) return emptyProjeto();
  if (partes.length === 1) return partes[0];

  const porNome = new Map<string, MovimentosProjetoConta>();
  for (const parte of partes) {
    for (const row of parte.porConta) {
      const atual = porNome.get(row.contaNome);
      if (!atual) {
        porNome.set(row.contaNome, {
          ...row,
          transacoesEntrada: [...row.transacoesEntrada],
          transacoesSaida: [...row.transacoesSaida],
        });
        continue;
      }
      atual.entradas += row.entradas;
      atual.saidas += row.saidas;
      atual.qtdEntradas += row.qtdEntradas;
      atual.qtdSaidas += row.qtdSaidas;
      atual.transacoesEntrada.push(...row.transacoesEntrada);
      atual.transacoesSaida.push(...row.transacoesSaida);
      atual.liquido = atual.entradas - atual.saidas;
    }
  }

  const porConta = Array.from(porNome.values()).sort((a, b) =>
    a.contaNome.localeCompare(b.contaNome, "pt-BR")
  );
  const entradas = porConta.reduce((s, c) => s + c.entradas, 0);
  const saidas = porConta.reduce((s, c) => s + c.saidas, 0);

  return {
    entradas,
    saidas,
    liquido: entradas - saidas,
    qtdEntradas: porConta.reduce((s, c) => s + c.qtdEntradas, 0),
    qtdSaidas: porConta.reduce((s, c) => s + c.qtdSaidas, 0),
    porConta,
    transacoesEntrada: porConta.flatMap((c) => c.transacoesEntrada),
    transacoesSaida: porConta.flatMap((c) => c.transacoesSaida),
  };
}

/** Meses inclusivos de jan/{ano} até o mês selecionado (cap no mês atual se ano corrente). */
export function getMesesYtd(
  mesSelecionado: string,
  hoje: Date = new Date()
): string[] {
  const [ano, mesSel] = mesSelecionado.split("-").map(Number);
  if (!ano || !mesSel) return [];

  const anoHoje = hoje.getFullYear();
  const mesHoje = hoje.getMonth() + 1;

  let mesFim = Math.min(Math.max(mesSel, 1), 12);
  if (ano > anoHoje) return [];
  if (ano === anoHoje) mesFim = Math.min(mesFim, mesHoje);

  const meses: string[] = [];
  for (let m = 1; m <= mesFim; m++) {
    meses.push(`${ano}-${String(m).padStart(2, "0")}`);
  }
  return meses;
}

export function getMesesNoPeriodo(
  mesSelecionado: string,
  periodo: DashboardPeriodo,
  hoje: Date = new Date()
): string[] {
  if (periodo === "mes") return [mesSelecionado];
  return getMesesYtd(mesSelecionado, hoje);
}

export function formatDashboardPeriodoLabel(
  mesSelecionado: string,
  periodo: DashboardPeriodo,
  mesesNoPeriodo?: string[]
): string {
  const [ano, mes] = mesSelecionado.split("-").map(Number);
  if (periodo === "mes") {
    return `${MESES_FULL[mes - 1]} ${ano}`;
  }
  const fimYm =
    mesesNoPeriodo && mesesNoPeriodo.length > 0
      ? mesesNoPeriodo[mesesNoPeriodo.length - 1]
      : mesSelecionado;
  const mesFim = Number(fimYm.split("-")[1]);
  return `Jan–${MESES_CURTO[mesFim - 1]} ${ano}`;
}

function isGastoVida(
  t: Transacao,
  contas: ContaItem[],
  tags: Tag[]
): boolean {
  return (
    t.valor < 0 &&
    isFluxoReal(t) &&
    !isTransacaoInvestimento(t, contas, tags) &&
    !isTransacaoProjeto(t, contas, tags) &&
    !hasTagTransacoesInternas(t, tags)
  );
}

function isReceitaVida(
  t: Transacao,
  contas: ContaItem[],
  tags: Tag[]
): boolean {
  return (
    t.valor > 0 &&
    isFluxoReal(t) &&
    !isTransacaoInvestimento(t, contas, tags) &&
    !isTransacaoProjeto(t, contas, tags) &&
    !hasTagTransacoesInternas(t, tags)
  );
}

/**
 * Stats do dashboard (mês ou YTD).
 * YTD = soma dos fluxos de vida / investimentos / projetos dos meses do intervalo.
 * Saldos por conta usam o mês de referência (fim do período), sem inventar carry-over YTD.
 */
export function calcDashboardStats(
  transacoes: Transacao[],
  tags: Tag[],
  contas: ContaItem[],
  mesSelecionado: string,
  contasAtivas: string[],
  periodo: DashboardPeriodo = "mes",
  hoje: Date = new Date()
): DashboardStats {
  const mesesNoPeriodo = getMesesNoPeriodo(mesSelecionado, periodo, hoje);
  const mesesSet = new Set(mesesNoPeriodo);
  const mesReferencia =
    periodo === "ytd" && mesesNoPeriodo.length > 0
      ? mesesNoPeriodo[mesesNoPeriodo.length - 1]
      : mesSelecionado;

  const mesEfetivoDe = (t: Transacao) => getMesEfetivo(t, contas);

  const transacoesPeriodo = transacoes.filter(
    (t) => mesesSet.has(mesEfetivoDe(t)) && contasAtivas.includes(t.conta)
  );

  const gastos = transacoesPeriodo.filter((t) => isGastoVida(t, contas, tags));
  const receitas = transacoesPeriodo.filter((t) =>
    isReceitaVida(t, contas, tags)
  );
  const gastosFluxo = gastos.reduce((sum, t) => sum + Math.abs(t.valor), 0);
  const receitasFluxo = receitas.reduce((sum, t) => sum + t.valor, 0);

  const temContaInvestimento = contas.some((c) => c.isInvestimento);
  const investimento = somarInvestimento(
    mesesNoPeriodo.map((mesYm) =>
      calcularMovimentosInvestimento(
        transacoes,
        contas,
        mesYm,
        mesEfetivoDe,
        contasAtivas,
        tags
      )
    )
  );

  const temContaProjeto = contas.some((c) => c.isProjeto);
  const projeto = somarProjeto(
    mesesNoPeriodo.map((mesYm) =>
      calcularMovimentosProjeto(
        transacoes,
        contas,
        mesYm,
        mesEfetivoDe,
        contasAtivas,
        tags
      )
    )
  );

  const totalGastos = totalGastosDashboard(gastosFluxo);
  const totalReceitas = totalReceitasDashboard(receitasFluxo);
  const saldo = calcularSaldoMes(totalReceitas, totalGastos);

  const gastosPorTagId: Record<string, number> = {};
  gastos.forEach((t) => {
    t.tagIds.forEach((tagId) => {
      gastosPorTagId[tagId] = (gastosPorTagId[tagId] || 0) + Math.abs(t.valor);
    });
  });
  const tagHierarchy = buildTagSpendingHierarchy(tags, gastosPorTagId);

  // Saldos de caixa: sempre do mês de referência (fim do YTD), não soma de saldos.
  const transacoesMesRef = transacoes.filter(
    (t) => mesEfetivoDe(t) === mesReferencia && contasAtivas.includes(t.conta)
  );
  const saldosConta = calcularSaldosContaMes(
    transacoes,
    transacoesMesRef,
    contas,
    mesReferencia,
    contasAtivas
  );
  const {
    saldoInicial: saldoInicialPorConta,
    movimentoMes: movimentoPorConta,
    saldoFinal: saldoFinalPorConta,
    pagamentosFatura,
  } = saldosConta;
  const somaCaixaMes = somarSaldoPorContaMes(
    saldoFinalPorConta,
    contas,
    "caixa"
  );

  const topContas = Object.entries(saldoFinalPorConta)
    .filter(([, s]) => s !== 0)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a)) as [string, number][];

  const maioresGastos = [...gastos]
    .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor))
    .slice(0, 5);

  const breakdownMensal: MesBreakdownItem[] =
    periodo === "ytd"
      ? mesesNoPeriodo.map((mesYm) => {
          const doMes = transacoesPeriodo.filter(
            (t) => mesEfetivoDe(t) === mesYm
          );
          const g = doMes
            .filter((t) => isGastoVida(t, contas, tags))
            .reduce((sum, t) => sum + Math.abs(t.valor), 0);
          const r = doMes
            .filter((t) => isReceitaVida(t, contas, tags))
            .reduce((sum, t) => sum + t.valor, 0);
          const mesNum = Number(mesYm.split("-")[1]);
          return {
            mesYm,
            mesCurto: MESES_CURTO[mesNum - 1],
            gastos: totalGastosDashboard(g),
            receitas: totalReceitasDashboard(r),
            saldo: calcularSaldoMes(
              totalReceitasDashboard(r),
              totalGastosDashboard(g)
            ),
          };
        })
      : [];

  return {
    periodo,
    mesesNoPeriodo,
    mesLabel: formatDashboardPeriodoLabel(mesSelecionado, periodo, mesesNoPeriodo),
    mesReferencia,
    totalGastosMes: totalGastos,
    totalReceitasMes: totalReceitas,
    gastosFluxo,
    receitasFluxo,
    saldoMes: saldo,
    somaCaixaMes,
    saldoInicialPorConta,
    movimentoPorConta,
    saldoFinalPorConta,
    pagamentosFatura,
    tagHierarchy,
    gastosPorTagId,
    gastos,
    receitas,
    topContas,
    maioresGastos,
    qtdTransacoesMes: transacoesPeriodo.length,
    qtdGastos: gastos.length,
    qtdReceitas: receitas.length,
    totalTransacoes: transacoes.length,
    temContaInvestimento,
    investimento,
    temContaProjeto,
    projeto,
    breakdownMensal,
  };
}
