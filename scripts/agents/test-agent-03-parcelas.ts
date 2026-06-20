/**
 * Agent 03 — compras parceladas
 */
import { assert, section, exitCode, installLocalStorageMock, removeBrowserGlobals } from "./_helpers";
import {
  parseParcela,
  groupParceladas,
  isParcelada,
  filterGruposAtivos,
  filterGruposEncerrados,
  distribuirValorParcelas,
  normalizarValoresParcelas,
  mapParcelasPorNumero,
} from "../../src/lib/parcelas-utils";
import { saveTransacoes, getTransacoes, clearLocalData } from "../../src/lib/store";
import type { Transacao } from "../../src/types";

section("parseParcela");
assert(parseParcela("Notebook 1/12")?.n === 1, "parcela 1");
assert(parseParcela("Notebook 1/12")?.total === 12, "total 12");
assert(parseParcela("Uber") === null, "não parcelada");

const parcelas: Transacao[] = [
  { id: "p1", descricao: "TV 1/3", valor: -100, conta: "CC", data: "2025-01-10", tagIds: [] },
  { id: "p2", descricao: "TV 2/3", valor: -100, conta: "CC", data: "2025-02-10", tagIds: [] },
  { id: "p3", descricao: "TV 3/3", valor: -100, conta: "CC", data: "2025-03-10", tagIds: [] },
];

section("Agrupamento");
const grupos = groupParceladas([...parcelas, { id: "x", descricao: "Luz", valor: -50, conta: "CC", data: "2025-01-05", tagIds: [] }]);
assert(grupos.size === 1, "um grupo parcelado");
const tv = Array.from(grupos.values())[0]!;
assert(tv.length === 3, "três parcelas TV");
assert(isParcelada("TV 2/3"), "isParcelada true");

section("Distribuição e normalização");
const vals = distribuirValorParcelas(100, 12);
assert(vals.length === 12, "12 valores");
assert(Math.abs(vals.reduce((s, v) => s + v, 0) - 100) < 0.01, "soma = total");
const norm = normalizarValoresParcelas(vals.slice(0, 11), 12, 100);
assert(norm.length === 12, "normaliza para 12");

section("Mapa por número (edição)");
const map = mapParcelasPorNumero(parcelas);
assert(map.get(1)?.id === "p1", "parcela 1 mapeada");
assert(map.get(3)?.id === "p3", "parcela 3 mapeada");

section("Criação em lote (12 parcelas)");
installLocalStorageMock();
clearLocalData();
const novas: Transacao[] = [];
const totalParcelas = 12;
const valores = distribuirValorParcelas(1200, totalParcelas);
for (let i = 0; i < totalParcelas; i++) {
  novas.push({
    id: `n${i}`,
    descricao: `Notebook ${i + 1}/${totalParcelas}`,
    valor: -valores[i]!,
    conta: "Nubank",
    data: `2025-${String(i + 1).padStart(2, "0")}-10`,
    tagIds: [],
  });
}
saveTransacoes(novas);
const salvas = getTransacoes();
assert(salvas.length === 12, "salva 12 parcelas de uma vez");
const grupo = groupParceladas(salvas);
assert(grupo.size === 1, "um grupo");
const lista = Array.from(grupo.values())[0]!;
assert(lista.length === 12, "grupo com 12");
assert(parseParcela(lista[0]!.descricao)?.n === 1, "começa na parcela 1");
removeBrowserGlobals();

section("Filtros ativo/encerrado");
const entries = Array.from(grupos.entries());
const venc = (t: Transacao) => t.data;
const encerrados = filterGruposEncerrados(entries, venc);
assert(encerrados.length === 1, "grupo encerrado (datas passadas)");

process.exit(exitCode());
