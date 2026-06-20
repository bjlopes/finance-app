/**
 * Agent 01 — store (transações, tags, contas, backup)
 */
import {
  assert,
  section,
  installLocalStorageMock,
  removeBrowserGlobals,
  exitCode,
} from "./_helpers";
import {
  getTransacoes,
  saveTransacao,
  deleteTransacao,
  getTags,
  saveTag,
  getContas,
  saveConta,
  exportBackup,
  importBackup,
  clearLocalData,
  saveTransferencia,
} from "../../src/lib/store";
import type { Transacao, Tag } from "../../src/types";

installLocalStorageMock();
clearLocalData();

section("Contas e tags padrão");
assert(getContas().length >= 1, "contas padrão carregadas");
assert(getTags().length >= 5, "tags padrão carregadas");

section("CRUD transação");
const t: Transacao = {
  id: "t1",
  descricao: "Uber",
  valor: -35.5,
  conta: getContas()[0]!.nome,
  data: "2025-06-10",
  tagIds: [getTags()[0]!.id],
};
saveTransacao(t);
assert(getTransacoes().length === 1, "salva transação");
assert(getTransacoes()[0]!.valor === -35.5, "valor preservado");
deleteTransacao("t1");
assert(getTransacoes().length === 0, "exclui transação");

section("Transferência no store");
saveConta({ id: "c-inv", nome: "Investimentos", isInvestimento: true });
saveConta({ id: "c-nu", nome: "Nubank" });
saveTransferencia({
  descricao: "Aporte",
  valor: 500,
  contaOrigem: "Nubank",
  contaDestino: "Investimentos",
  data: "2025-06-15",
});
assert(getTransacoes().length === 2, "transferência cria duas pernas");
deleteTransacao(getTransacoes().find((x) => x.valor < 0)!.id);
assert(getTransacoes().length === 0, "excluir origem remove par");

section("Backup roundtrip");
saveTransacao({
  id: "bk1",
  descricao: "Salário",
  valor: 5000,
  conta: "Nubank",
  data: "2025-06-05",
  tagIds: [],
});
const json = exportBackup();
clearLocalData();
assert(getTransacoes().length === 0, "clear após export");
const imp = importBackup(json);
assert(imp.ok, "import backup ok");
assert(getTransacoes().some((x) => x.descricao === "Salário"), "restaura transação");

section("Tag");
const tag: Tag = { id: "tg-new", nome: "viagem", cor: "#3b82f6" };
saveTag(tag);
assert(getTags().some((x) => x.id === "tg-new"), "salva tag");

section("Ordenação — mesma data, última adicionada no topo");
clearLocalData();
saveTransacao({
  id: "ord1",
  descricao: "Primeira",
  valor: -10,
  conta: "Nubank",
  data: "2025-06-15",
  tagIds: [],
});
saveTransacao({
  id: "ord2",
  descricao: "Segunda",
  valor: -20,
  conta: "Nubank",
  data: "2025-06-15",
  tagIds: [],
});
const ordenadas = getTransacoes();
assert(ordenadas[0]!.id === "ord2", "mais recente no topo");
assert(Boolean(ordenadas[0]!.criadoEm), "criadoEm preenchido");

removeBrowserGlobals();
process.exit(exitCode());
