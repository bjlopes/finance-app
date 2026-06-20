/**
 * Agent 09 — backup import/export (validação e roundtrip)
 */
import {
  assert,
  section,
  installLocalStorageMock,
  removeBrowserGlobals,
  exitCode,
} from "./_helpers";
import {
  exportBackup,
  importBackup,
  clearLocalData,
  getTransacoes,
  getTags,
  getContas,
  saveTransacao,
  saveConta,
  saveTag,
} from "../../src/lib/store";
import type { Transacao } from "../../src/types";

installLocalStorageMock();
clearLocalData();

section("Export vazio");
const empty = exportBackup();
assert(empty.includes('"transacoes"'), "JSON tem transacoes");
assert(empty.includes('"tags"'), "JSON tem tags");
assert(empty.includes('"contas"'), "JSON tem contas");

section("Roundtrip completo");
saveConta({ id: "c1", nome: "Nubank", isInvestimento: false });
saveTag({ id: "tg1", nome: "lazer", cor: "#f59e0b" });
const tx: Transacao = {
  id: "tx1",
  descricao: "Cinema",
  valor: -40,
  conta: "Nubank",
  data: "2025-06-20",
  tagIds: ["tg1"],
};
saveTransacao(tx);

const json = exportBackup();
clearLocalData();
assert(getTransacoes().length === 0, "limpo após export");

const result = importBackup(json);
assert(result.ok, `import ok (${result.error ?? ""})`);
assert(getTransacoes().length === 1, "restaura transação");
assert(getTags().some((t) => t.nome === "lazer"), "restaura tag");
assert(getContas().some((c) => c.nome === "Nubank"), "restaura conta");

section("JSON inválido");
const bad = importBackup("{ invalid json");
assert(!bad.ok, "rejeita JSON inválido");
assert(Boolean(bad.error), "mensagem de erro");

section("Campos extras ignorados");
const parsed = JSON.parse(json) as Record<string, unknown>;
parsed._exportedAt = "2099-01-01";
parsed.version = 999;
const extra = importBackup(JSON.stringify(parsed));
assert(extra.ok, "import tolera campos extras no JSON");

removeBrowserGlobals();
process.exit(exitCode());
