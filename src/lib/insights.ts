import type { ContaItem } from "@/context/DataContext";
import type { Tag, Transacao } from "@/types";
import { getMesEfetivo } from "@/lib/fluxoCaixa";
import {
  hasTagTransacoesInternas,
  isFluxoReal,
  isTransacaoInvestimento,
} from "@/lib/transferencias";

export interface InsightPontual {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  motivo: string;
}

export interface InsightCategoria {
  nome: string;
  tipico: number;
  atual: number;
  diferencaPercentual: number | null;
}

export interface InsightsFinanceiros {
  mesReferencia: string;
  mesesBase: string[];
  custoVidaTipico: number;
  faixaBaixa: number;
  faixaAlta: number;
  gastoAtual: number;
  receitaTipica: number;
  sobraTipica: number;
  taxaPoupancaTipica: number | null;
  confianca: "baixa" | "média" | "alta";
  pontuaisExcluidos: InsightPontual[];
  pontuaisDoMes: InsightPontual[];
  categorias: InsightCategoria[];
  mensagens: string[];
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\d+/g, "#")
    .replace(/\s+/g, " ");
}

function addMes(mesYm: string, delta: number): string {
  const [ano, mes] = mesYm.split("-").map(Number);
  const d = new Date(ano, mes - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function mediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  const sorted = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[meio]
    : (sorted[meio - 1] + sorted[meio]) / 2;
}

function quantil(valores: number[], q: number): number {
  if (valores.length === 0) return 0;
  const sorted = [...valores].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const resto = pos - base;
  return sorted[base + 1] == null
    ? sorted[base]
    : sorted[base] + resto * (sorted[base + 1] - sorted[base]);
}

function getTagRaiz(tag: Tag, tags: Tag[]): Tag {
  if (!tag.parentId) return tag;
  const pai = tags.find((t) => t.id === tag.parentId);
  return pai ? getTagRaiz(pai, tags) : tag;
}

const TAGS_META = new Set([
  "recorrente",
  "pontual",
  "necessidade",
  "desejo",
  "regra",
  "contexto",
  "frequencia",
]);

function getCategoria(t: Transacao, tags: Tag[]): string {
  const candidatas = t.tagIds
    .map((id) => tags.find((tag) => tag.id === id))
    .filter((tag): tag is Tag => Boolean(tag))
    .map((tag) => getTagRaiz(tag, tags));
  const principal =
    candidatas.find((tag) => !TAGS_META.has(normalizar(tag.nome))) ??
    candidatas[0];
  return principal?.nome || "Sem categoria";
}

function temTagNome(t: Transacao, tags: Tag[], nomes: string[]): boolean {
  const alvo = new Set(nomes.map(normalizar));
  return t.tagIds.some((id) => {
    let tag = tags.find((item) => item.id === id);
    while (tag) {
      if (alvo.has(normalizar(tag.nome))) return true;
      tag = tag.parentId
        ? tags.find((item) => item.id === tag?.parentId)
        : undefined;
    }
    return false;
  });
}

function isDespesaVida(t: Transacao, contas: ContaItem[], tags: Tag[]): boolean {
  return (
    t.valor < 0 &&
    isFluxoReal(t) &&
    !isTransacaoInvestimento(t, contas, tags) &&
    !hasTagTransacoesInternas(t, tags)
  );
}

function isReceitaVida(t: Transacao, contas: ContaItem[], tags: Tag[]): boolean {
  const descricao = normalizar(t.descricao);
  return (
    t.valor > 0 &&
    isFluxoReal(t) &&
    !isTransacaoInvestimento(t, contas, tags) &&
    !hasTagTransacoesInternas(t, tags) &&
    !descricao.includes("saldo inicial")
  );
}

export function calcularInsightsFinanceiros(
  transacoes: Transacao[],
  tags: Tag[],
  contas: ContaItem[],
  mesReferencia: string,
  janelaMeses = 6
): InsightsFinanceiros {
  const mesesCandidatos = Array.from(
    { length: janelaMeses },
    (_, i) => addMes(mesReferencia, -(janelaMeses - i))
  );
  const mesesComDados = new Set(
    transacoes
      .filter(
        (t) =>
          isDespesaVida(t, contas, tags) || isReceitaVida(t, contas, tags)
      )
      .map((t) => getMesEfetivo(t, contas))
  );
  let mesesBase = mesesCandidatos.filter((mes) => mesesComDados.has(mes));

  if (mesesBase.length === 0 && mesesComDados.has(mesReferencia)) {
    mesesBase = [mesReferencia];
  }

  const despesas = transacoes.filter((t) => isDespesaVida(t, contas, tags));
  const receitas = transacoes.filter((t) => isReceitaVida(t, contas, tags));
  const despesasBase = despesas.filter((t) =>
    mesesBase.includes(getMesEfetivo(t, contas))
  );

  const mesesPorDescricao = new Map<string, Set<string>>();
  for (const t of despesasBase) {
    const chave = normalizar(t.descricao);
    if (!mesesPorDescricao.has(chave)) mesesPorDescricao.set(chave, new Set());
    mesesPorDescricao.get(chave)!.add(getMesEfetivo(t, contas));
  }

  const medianaTransacao = mediana(
    despesasBase.map((t) => Math.abs(t.valor)).filter((v) => v > 0)
  );

  const isPontual = (t: Transacao): { pontual: boolean; motivo: string } => {
    if (temTagNome(t, tags, ["pontual"])) {
      return { pontual: true, motivo: "Marcado como pontual" };
    }
    if (t.recorrente || temTagNome(t, tags, ["recorrente"])) {
      return { pontual: false, motivo: "" };
    }
    const ocorrencias =
      mesesPorDescricao.get(normalizar(t.descricao))?.size ?? 0;
    const limite = Math.max(500, medianaTransacao * 2.5);
    if (Math.abs(t.valor) >= limite && ocorrencias <= 2) {
      return {
        pontual: true,
        motivo: `Valor alto e apareceu em ${ocorrencias || 1} mês(es)`,
      };
    }
    return { pontual: false, motivo: "" };
  };

  const pontuaisBase = new Map<string, InsightPontual>();
  for (const t of despesasBase) {
    const classificacao = isPontual(t);
    if (!classificacao.pontual) continue;
    pontuaisBase.set(t.id, {
      id: t.id,
      descricao: t.descricao,
      valor: Math.abs(t.valor),
      data: t.data,
      categoria: getCategoria(t, tags),
      motivo: classificacao.motivo,
    });
  }

  const totaisMesBase = mesesBase.map((mes) =>
    despesasBase
      .filter(
        (t) =>
          getMesEfetivo(t, contas) === mes && !pontuaisBase.has(t.id)
      )
      .reduce((soma, t) => soma + Math.abs(t.valor), 0)
  );

  const custoVidaTipico = mediana(totaisMesBase);
  const faixaBaixa = quantil(totaisMesBase, 0.25);
  const faixaAlta = quantil(totaisMesBase, 0.75);
  const gastoAtual = despesas
    .filter((t) => getMesEfetivo(t, contas) === mesReferencia)
    .reduce((soma, t) => soma + Math.abs(t.valor), 0);
  const receitasMesBase = mesesBase.map((mes) =>
    receitas
      .filter((t) => getMesEfetivo(t, contas) === mes)
      .reduce((soma, t) => soma + t.valor, 0)
  );
  const receitaTipica = mediana(receitasMesBase);
  const sobraTipica = receitaTipica - custoVidaTipico;
  const taxaPoupancaTipica =
    receitaTipica > 0 ? (sobraTipica / receitaTipica) * 100 : null;

  const despesasMesAtual = despesas.filter(
    (t) => getMesEfetivo(t, contas) === mesReferencia
  );
  const pontuaisDoMes = despesasMesAtual
    .map((t) => ({ t, classificacao: isPontual(t) }))
    .filter(({ classificacao }) => classificacao.pontual)
    .map(({ t, classificacao }) => ({
      id: t.id,
      descricao: t.descricao,
      valor: Math.abs(t.valor),
      data: t.data,
      categoria: getCategoria(t, tags),
      motivo: classificacao.motivo,
    }))
    .sort((a, b) => b.valor - a.valor);

  const categoriasNomes = new Set(
    [...despesasBase, ...despesasMesAtual].map((t) => getCategoria(t, tags))
  );
  const categorias = Array.from(categoriasNomes)
    .map((nome) => {
      const valoresBase = mesesBase.map((mes) =>
        despesasBase
          .filter(
            (t) =>
              getMesEfetivo(t, contas) === mes &&
              getCategoria(t, tags) === nome &&
              !pontuaisBase.has(t.id)
          )
          .reduce((soma, t) => soma + Math.abs(t.valor), 0)
      );
      const tipico = mediana(valoresBase);
      const atual = despesasMesAtual
        .filter((t) => getCategoria(t, tags) === nome)
        .reduce((soma, t) => soma + Math.abs(t.valor), 0);
      return {
        nome,
        tipico,
        atual,
        diferencaPercentual:
          tipico > 0 ? ((atual - tipico) / tipico) * 100 : null,
      };
    })
    .filter((c) => c.tipico > 0 || c.atual > 0)
    .sort((a, b) => Math.max(b.tipico, b.atual) - Math.max(a.tipico, a.atual))
    .slice(0, 6);

  const confianca: InsightsFinanceiros["confianca"] =
    mesesBase.length >= 5 ? "alta" : mesesBase.length >= 3 ? "média" : "baixa";

  const mensagens: string[] = [];
  if (custoVidaTipico > 0) {
    const delta = ((gastoAtual - custoVidaTipico) / custoVidaTipico) * 100;
    if (delta > 15) {
      mensagens.push(
        `O mês está ${Math.round(delta)}% acima do seu custo de vida típico.`
      );
    } else if (delta < -15) {
      mensagens.push(
        `O mês está ${Math.abs(Math.round(delta))}% abaixo do seu custo de vida típico.`
      );
    } else {
      mensagens.push("O mês está próximo do seu padrão normal de gastos.");
    }
  }
  if (pontuaisDoMes.length > 0) {
    mensagens.push(
      `${pontuaisDoMes.length} gasto(s) pontual(is) podem explicar parte da variação do mês.`
    );
  }
  const categoriaAlta = categorias.find(
    (c) => c.diferencaPercentual != null && c.diferencaPercentual > 25
  );
  if (categoriaAlta) {
    mensagens.push(
      `${categoriaAlta.nome} está ${Math.round(
        categoriaAlta.diferencaPercentual!
      )}% acima do padrão.`
    );
  }
  if (taxaPoupancaTipica != null) {
    mensagens.push(
      taxaPoupancaTipica >= 20
        ? `Sua folga típica é saudável: cerca de ${Math.round(
            taxaPoupancaTipica
          )}% da renda.`
        : `Sua folga típica é de cerca de ${Math.round(
            taxaPoupancaTipica
          )}% da renda.`
    );
  }

  return {
    mesReferencia,
    mesesBase,
    custoVidaTipico,
    faixaBaixa,
    faixaAlta,
    gastoAtual,
    receitaTipica,
    sobraTipica,
    taxaPoupancaTipica,
    confianca,
    pontuaisExcluidos: Array.from(pontuaisBase.values()).sort(
      (a, b) => b.valor - a.valor
    ),
    pontuaisDoMes,
    categorias,
    mensagens,
  };
}
