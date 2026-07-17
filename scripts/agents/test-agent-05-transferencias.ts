/**
 * Agent 05 — transferências entre contas + conversão de "transações internas"
 */
import { assert, section, approx, exitCode } from "./_helpers";
import {
  isTransferencia,
  isTransferenciaDestino,
  isFluxoReal,
  filtrarTransacoesParaLista,
  getContaDestinoTransferencia,
  getContaOrigemTransferencia,
  converterTransacoesInternasParaTransferencias,
  isTagTransacoesInternas,
} from "../../src/lib/transferencias";
import type { Transacao, Tag } from "../../src/types";

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

section("Conversão tag transações internas");
const tags: Tag[] = [
  { id: "ti", nome: "Transações Internas", cor: "#64748b" },
  { id: "t1", nome: "transporte", cor: "#3b82f6" },
];
assert(isTagTransacoesInternas(tags[0]), "reconhece tag");

const legadas: Transacao[] = [
  {
    id: "a",
    descricao: "Pix casa",
    valor: -800,
    conta: "Nubank",
    data: "2025-03-05",
    tagIds: ["ti"],
  },
  {
    id: "b",
    descricao: "Pix casa",
    valor: 800,
    conta: "Itaú",
    data: "2025-03-05",
    tagIds: ["ti"],
  },
  {
    id: "c",
    descricao: "Mercado",
    valor: -50,
    conta: "Nubank",
    data: "2025-03-06",
    tagIds: ["t1"],
  },
];

let idSeq = 0;
const convertido = converterTransacoesInternasParaTransferencias(
  legadas,
  tags,
  () => `tid-gen-${++idSeq}`
);
assert(convertido.convertidas === 1, "1 par convertido");
assert(convertido.semPar === 0, "sem órfãos");
const a = convertido.transacoes.find((t) => t.id === "a")!;
const b = convertido.transacoes.find((t) => t.id === "b")!;
assert(isTransferencia(a) && isTransferencia(b), "ambas viram transferência");
assert(a.transferenciaId === b.transferenciaId, "mesmo id de transferência");
assert(a.contaDestino === "Itaú", "conta destino preenchida");
assert(a.tagIds.length === 0 && b.tagIds.length === 0, "tag interna removida");
assert(approx(Math.abs(a.valor), 800), "valor preservado");

const deNovo = converterTransacoesInternasParaTransferencias(convertido.transacoes, tags);
assert(deNovo.convertidas === 0, "idempotente");

section("Parcial: só uma perna com a tag");
const parcial = converterTransacoesInternasParaTransferencias(
  [
    {
      id: "x",
      descricao: "Envio",
      valor: -200,
      conta: "Nubank",
      data: "2025-04-01",
      tagIds: ["ti"],
    },
    {
      id: "y",
      descricao: "Recebido",
      valor: 200,
      conta: "Itaú",
      data: "2025-04-01",
      tagIds: [],
    },
  ],
  tags,
  () => "tid-parcial"
);
assert(parcial.convertidas === 1, "emparelha com contra-partida sem tag");
assert(isTransferencia(parcial.transacoes.find((t) => t.id === "x")!), "origem convertida");

process.exit(exitCode());
