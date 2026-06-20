/**
 * Agent 05 — transferências entre contas
 */
import { assert, section, exitCode } from "./_helpers";
import {
  isTransferencia,
  isTransferenciaDestino,
  isFluxoReal,
  filtrarTransacoesParaLista,
  getContaDestinoTransferencia,
  getContaOrigemTransferencia,
} from "../../src/lib/transferencias";
import type { Transacao } from "../../src/types";

const origem: Transacao = {
  id: "1",
  descricao: "Pix",
  valor: -500,
  conta: "Itaú",
  contaDestino: "Nubank",
  data: "2025-06-10",
  tagIds: [],
  transferenciaId: "tid-1",
};

const destino: Transacao = {
  id: "2",
  descricao: "Pix",
  valor: 500,
  conta: "Nubank",
  data: "2025-06-10",
  tagIds: [],
  transferenciaId: "tid-1",
};

const despesa: Transacao = {
  id: "3",
  descricao: "Uber",
  valor: -30,
  conta: "Nubank",
  data: "2025-06-11",
  tagIds: ["t1"],
};

section("Helpers");
assert(isTransferencia(origem), "é transferência");
assert(isTransferenciaDestino(destino), "perna destino");
assert(!isFluxoReal(origem), "não é fluxo real");
assert(isFluxoReal(despesa), "despesa é fluxo real");
assert(getContaDestinoTransferencia(origem, [origem, destino]) === "Nubank", "destino");
assert(getContaOrigemTransferencia(destino, [origem, destino]) === "Itaú", "origem");

section("Lista");
const lista = filtrarTransacoesParaLista([origem, destino, despesa]);
assert(lista.length === 2, "oculta perna destino");

process.exit(exitCode());
