import { getMesEfetivo } from "@/lib/fluxoCaixa";
import { isFluxoReal, isTransacaoInvestimento, isTransacaoProjeto, hasTagTransacoesInternas } from "@/lib/transferencias";
import type { ContaItem } from "@/context/DataContext";
import type { Transacao, Tag } from "@/types";

export interface MesStats {
  totalGastosMes: number;
  totalReceitasMes: number;
  saldoMes: number;
  topTags: { nome: string; valor: number }[];
  totalTransacoes: number;
}

/** Stats do mês — alinhado ao dashboard (getMesEfetivo + isFluxoReal). */
export function calcMesStats(
  transacoes: Transacao[],
  tags: Tag[],
  contas: ContaItem[],
  mesYm: string
): MesStats {
  const transacoesMes = transacoes.filter(
    (t) => getMesEfetivo(t, contas) === mesYm
  );

  const totalGastos = transacoesMes
    .filter(
      (t) =>
        t.valor < 0 &&
        isFluxoReal(t) &&
        !isTransacaoInvestimento(t, contas, tags) &&
        !isTransacaoProjeto(t, contas, tags) &&
        !hasTagTransacoesInternas(t, tags)
    )
    .reduce((sum, t) => sum + t.valor, 0);

  const totalReceitas = transacoesMes
    .filter(
      (t) =>
        t.valor > 0 &&
        isFluxoReal(t) &&
        !isTransacaoInvestimento(t, contas, tags) &&
        !isTransacaoProjeto(t, contas, tags) &&
        !hasTagTransacoesInternas(t, tags)
    )
    .reduce((sum, t) => sum + t.valor, 0);

  const porTag: Record<string, number> = {};
  transacoesMes
    .filter(
      (t) =>
        t.valor < 0 &&
        isFluxoReal(t) &&
        !isTransacaoInvestimento(t, contas, tags) &&
        !isTransacaoProjeto(t, contas, tags) &&
        !hasTagTransacoesInternas(t, tags)
    )
    .forEach((t) => {
      t.tagIds.forEach((tagId) => {
        const tag = tags.find((tg) => tg.id === tagId);
        const nome = tag?.nome || "sem tag";
        porTag[nome] = (porTag[nome] || 0) + Math.abs(t.valor);
      });
    });

  const topTags = Object.entries(porTag)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nome, valor]) => ({ nome, valor }));

  return {
    totalGastosMes: Math.abs(totalGastos),
    totalReceitasMes: totalReceitas,
    saldoMes: totalReceitas + totalGastos,
    topTags,
    totalTransacoes: transacoes.length,
  };
}

export function getMesAtualYm(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
