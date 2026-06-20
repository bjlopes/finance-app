/**
 * Agent 02 — hierarquia de tags e gastos
 */
import { assert, section, approx, exitCode } from "./_helpers";
import {
  buildTagTree,
  buildTagSpendingHierarchy,
  getTagPath,
  getTagPathCompact,
  getTagIdsForFilter,
  canAddSubtag,
  getTagDepth,
  tagHasSubtags,
} from "../../src/lib/tags-utils";
import type { Tag } from "../../src/types";

const tags: Tag[] = [
  { id: "1", nome: "casa", cor: "#8b5cf6" },
  { id: "2", nome: "aluguel", cor: "#a855f7", parentId: "1" },
  { id: "3", nome: "condomínio", cor: "#c084fc", parentId: "1" },
  { id: "4", nome: "transporte", cor: "#3b82f6" },
  { id: "5", nome: "uber", cor: "#60a5fa", parentId: "4" },
];

section("Árvore e profundidade");
const tree = buildTagTree(tags);
assert(tree.length === 2, "duas tags raiz");
assert(getTagDepth(tags[1]!, tags) === 1, "aluguel profundidade 1");
assert(canAddSubtag(tags[1]!, tags), "pode subtag em nível 1");
assert(tagHasSubtags("1", tags), "casa tem subtags");

section("Caminhos");
assert(getTagPath(tags[1]!, tags) === "casa › aluguel", "caminho completo");
assert(getTagPathCompact(tags[1]!, tags).includes("casa"), "caminho compacto");

section("Filtro com subtags");
const ids = getTagIdsForFilter("1", tags, true);
assert(ids.includes("2") && ids.includes("3"), "filtro inclui filhos");

section("Gastos hierárquicos");
const gastos: Record<string, number> = { "2": 100, "5": 50 };
const hier = buildTagSpendingHierarchy(tags, gastos);
const casa = hier.find((n) => n.tag.id === "1");
assert(Boolean(casa), "nó casa existe");
assert(Boolean(casa && approx(casa.total, 100)), "total casa = aluguel");
const transp = hier.find((n) => n.tag.id === "4");
assert(Boolean(transp && approx(transp.total, 50)), "total transporte");

process.exit(exitCode());
