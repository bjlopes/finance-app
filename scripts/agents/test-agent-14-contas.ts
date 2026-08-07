/**
 * Agent 14 — página Contas (CC + investimento)
 */
import fs from "node:fs";
import path from "node:path";
import {
  assert,
  section,
  installLocalStorageMock,
  removeBrowserGlobals,
  exitCode,
} from "./_helpers";
import { saveConta, getContas, clearLocalData } from "../../src/lib/store";

const ROOT = path.resolve(__dirname, "../..");
const PAGE = path.join(ROOT, "src/app/contas/page.tsx");
const pageSrc = fs.readFileSync(PAGE, "utf8");

section("UI — flags e badges");
assert(pageSrc.includes("isCartaoCredito"), "checkbox cartão de crédito");
assert(pageSrc.includes("isInvestimento"), "checkbox investimento");
assert(pageSrc.includes("Conta de investimento"), "label investimento");
assert(pageSrc.includes("Invest."), "badge Invest.");
assert(pageSrc.includes("dataFechamento"), "campo fechamento fatura");
assert(pageSrc.includes("contaPagamentoId"), "campo conta de pagamento");
assert(pageSrc.includes("fechamento + 7"), "pagamento derivado do fechamento");
assert(pageSrc.includes("diaPagamentoFromFechamento"), "helper dia pagamento");

section("Store — persistência");
installLocalStorageMock();
clearLocalData();

saveConta({
  id: "nubank",
  nome: "Nubank",
});
saveConta({
  id: "cc1",
  nome: "Cartão XP",
  isCartaoCredito: true,
  dataFechamento: 10,
  contaPagamentoId: "nubank",
  diaPagamento: 17,
});
saveConta({
  id: "inv1",
  nome: "CDBs",
  isInvestimento: true,
});

const contas = getContas();
const cc = contas.find((c) => c.nome === "Cartão XP");
const inv = contas.find((c) => c.nome === "CDBs");
assert(Boolean(cc?.isCartaoCredito), "persiste isCartaoCredito");
assert(cc?.dataFechamento === 10, "persiste dataFechamento");
assert(cc?.contaPagamentoId === "nubank", "persiste contaPagamentoId");
assert(cc?.diaPagamento === 17, "persiste diaPagamento derivado");
assert(Boolean(inv?.isInvestimento), "persiste isInvestimento");

removeBrowserGlobals();
process.exit(exitCode());
