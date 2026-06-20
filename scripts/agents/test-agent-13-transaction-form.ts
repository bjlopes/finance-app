/**
 * Agent 13 — TransactionForm (modo transferência e edição)
 */
import fs from "node:fs";
import path from "node:path";
import { assert, section, exitCode } from "./_helpers";

const ROOT = path.resolve(__dirname, "../..");
const FORM = path.join(ROOT, "src/components/TransactionForm.tsx");
const src = fs.readFileSync(FORM, "utf8");

section("Modos do formulário");
assert(src.includes('"normal" | "transferencia"'), "tipos de modo");
assert(src.includes('setModo("transferencia")'), "botão transferência");
assert(src.includes('modo === "transferencia"'), "render condicional transferência");

section("Campos De/Para");
assert(src.includes('"De (origem)"'), 'label "De (origem)"');
assert(src.includes("contaDestino"), "campo conta destino");
assert(src.includes("saveTransferencia"), "salva via saveTransferencia");

section("Edição de transferência");
assert(src.includes("isEdicaoTransferencia"), "flag edição transferência");
assert(src.includes("Editar transferência"), "título edição");
assert(src.includes("Atualizar transferência"), "botão atualizar");
assert(src.includes("getContaOrigemTransferencia"), "preenche origem na edição");
assert(src.includes("getContaDestinoTransferencia"), "preenche destino na edição");

section("Validação");
assert(src.includes("contaOrigem") || src.includes("contaDe"), "valida origem");
assert(src.includes("contaDestino") && src.includes("origem"), "valida par de contas");
assert(src.includes("Registrar transferência"), "CTA registrar");

section("Modo normal preservado");
assert(src.includes('setModo("normal")'), "volta ao modo normal");
assert(src.includes("saveTransacao"), "modo normal usa saveTransacao");

process.exit(exitCode());
