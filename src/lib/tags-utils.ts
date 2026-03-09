import type { Tag } from "@/types";

export const MAX_SUBTAG_DEPTH = 2; // tag -> subtag -> sub-subtag (2 níveis)

export function getTagDepth(tag: Tag, tags: Tag[]): number {
  if (!tag.parentId) return 0;
  const parent = tags.find((t) => t.id === tag.parentId);
  if (!parent) return 0;
  return 1 + getTagDepth(parent, tags);
}

export function canAddSubtag(tag: Tag, tags: Tag[]): boolean {
  return getTagDepth(tag, tags) < MAX_SUBTAG_DEPTH;
}

export function getTagPath(tag: Tag, tags: Tag[]): string {
  if (!tag.parentId) return tag.nome;
  const parent = tags.find((t) => t.id === tag.parentId);
  if (!parent) return tag.nome;
  return `${getTagPath(parent, tags)} › ${tag.nome}`;
}

/** Versão compacta para exibição em listas: mostra tag principal › leaf (ex: assunto › uber) */
export function getTagPathCompact(tag: Tag, tags: Tag[]): string {
  const full = getTagPath(tag, tags);
  const parts = full.split(" › ");
  if (parts.length <= 2) return full;
  return `${parts[0]} › ${parts[parts.length - 1]}`;
}

export interface TagNode {
  tag: Tag;
  children: TagNode[];
}

export function buildTagTree(tags: Tag[]): TagNode[] {
  const byParent = new Map<string | undefined, Tag[]>();
  tags.forEach((t) => {
    const key = t.parentId ?? "__root__";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(t);
  });

  function build(parentId: string | undefined): TagNode[] {
    const list = byParent.get(parentId ?? "__root__") ?? [];
    return list
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((tag) => ({
        tag,
        children: build(tag.id),
      }));
  }

  return build(undefined);
}

export function flattenTagTree(nodes: TagNode[]): Tag[] {
  const result: Tag[] = [];
  function visit(n: TagNode) {
    result.push(n.tag);
    n.children.forEach(visit);
  }
  nodes.forEach(visit);
  return result;
}

/** Nó hierárquico com gastos para visualização (tag pai + subtags) */
export interface TagSpendingNode {
  tag: Tag;
  valor: number; // gasto direto nesta tag
  total: number; // valor + soma dos filhos (para tag pai)
  children: TagSpendingNode[];
}

/**
 * Constrói árvore de gastos por tag hierárquica.
 * Agrupa subtags sob a tag pai; total do pai = próprio + soma dos filhos.
 */
export function buildTagSpendingHierarchy(
  tags: Tag[],
  gastosPorTagId: Record<string, number>
): TagSpendingNode[] {
  const byParent = new Map<string | undefined, Tag[]>();
  tags.forEach((t) => {
    const key = t.parentId ?? "__root__";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(t);
  });

  function build(parentId: string | undefined): TagSpendingNode[] {
    const list = byParent.get(parentId ?? "__root__") ?? [];
    return list
      .map((tag) => {
        const valor = gastosPorTagId[tag.id] ?? 0;
        const childNodes = build(tag.id);
        const totalFilhos = childNodes.reduce((s, c) => s + c.total, 0);
        const total = valor + totalFilhos;
        return {
          tag,
          valor,
          total,
          children: childNodes.sort((a, b) => b.total - a.total),
        };
      })
      .filter((n) => n.total > 0)
      .sort((a, b) => b.total - a.total);
  }

  return build(undefined);
}

/** Retorna todos os IDs descendentes recursivamente (filhos, netos, etc.). */
function getDescendantIds(tagId: string, tags: Tag[]): string[] {
  const direct = tags.filter((t) => t.parentId === tagId).map((t) => t.id);
  const nested = direct.flatMap((id) => getDescendantIds(id, tags));
  return [...direct, ...nested];
}

/**
 * Retorna os IDs de tag a considerar no filtro.
 * Se includeSubtags e a tag for pai, inclui a tag + subtags selecionadas (recursivo).
 * selectedSubtagIds: quando vazio e includeSubtags=true, inclui todas as subtags.
 */
export function getTagIdsForFilter(
  tagId: string,
  tags: Tag[],
  includeSubtags: boolean,
  selectedSubtagIds?: string[]
): string[] {
  const tag = tags.find((t) => t.id === tagId);
  if (!tag) return [tagId];

  if (!includeSubtags) return [tagId];

  const allDescendantIds = getDescendantIds(tagId, tags);

  let ids: string[];
  if (selectedSubtagIds === undefined) {
    ids = allDescendantIds;
  } else {
    const selected = selectedSubtagIds.filter((id) => allDescendantIds.includes(id));
    const withDescendants = new Set(selected);
    selected.forEach((id) => getDescendantIds(id, tags).forEach((d) => withDescendants.add(d)));
    ids = Array.from(withDescendants);
  }

  return [tagId, ...ids];
}

/** Retorna as subtags diretas de uma tag pai. */
export function getSubtags(tagId: string, tags: Tag[]): Tag[] {
  return tags.filter((t) => t.parentId === tagId).sort((a, b) => a.nome.localeCompare(b.nome));
}

/** Retorna todos os descendentes (para exibir no filtro com hierarquia). */
export function getAllDescendants(tagId: string, tags: Tag[]): Tag[] {
  return getDescendantIds(tagId, tags)
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is Tag => !!t);
}

/** Verifica se a tag tem subtags (tem filhos diretos). */
export function tagHasSubtags(tagId: string, tags: Tag[]): boolean {
  return tags.some((t) => t.parentId === tagId);
}
