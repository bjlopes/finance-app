"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight, Check, Tags, ListFilter, X } from "lucide-react";
import { TransactionForm } from "@/components/TransactionForm";
import { TagSubtagInput } from "@/components/TagSubtagInput";
import { useData } from "@/context/DataContext";
import {
  getTagPath,
  getTagIdsForFilter,
  tagHasSubtags,
  getAllDescendants,
  flattenTagTree,
  buildTagTree,
} from "@/lib/tags-utils";
import { formatLocalDate, getLocalDateString } from "@/lib/dateUtils";
import { groupParceladas, isParcelada, filterGruposAtivos, parseParcela } from "@/lib/parcelas-utils";
import { getDataVencimentoFatura } from "@/lib/fluxoCaixa";
import type { Transacao } from "@/types";

export default function TransacoesPage() {
  const searchParams = useSearchParams();
  const { transacoes, tags, contas, loading, deleteTransacao, saveTransacao, createTag } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);
  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const [includeSubtags, setIncludeSubtags] = useState(true);
  const [selectedSubtagIds, setSelectedSubtagIds] = useState<string[]>([]);
  const [subtagDropdownOpen, setSubtagDropdownOpen] = useState(false);
  const [searchDesc, setSearchDesc] = useState("");
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkTagIds, setBulkTagIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [filterDataDe, setFilterDataDe] = useState<string>("");
  const [filterDataAte, setFilterDataAte] = useState<string>("");
  const [expandedParceladaKey, setExpandedParceladaKey] = useState<string | null>(null);
  const [parceladasModalOpen, setParceladasModalOpen] = useState(false);
  const subtagDropdownRef = useRef<HTMLDivElement>(null);

  const RECENT_DAYS = 30;

  const tagsFlat = useMemo(
    () => flattenTagTree(buildTagTree(tags)),
    [tags]
  );

  const subtagsDaTag = useMemo(
    () => (filterTagId ? getAllDescendants(filterTagId, tags) : []),
    [filterTagId, tags]
  );

  useEffect(() => {
    const tagFromUrl = searchParams.get("tag");
    if (tagFromUrl && tags.some((t) => t.id === tagFromUrl)) {
      setFilterTagId(tagFromUrl);
    }
  }, [searchParams, tags]);

  useEffect(() => {
    if (filterTagId && includeSubtags && subtagsDaTag.length > 0) {
      setSelectedSubtagIds(subtagsDaTag.map((t) => t.id));
    } else {
      setSelectedSubtagIds([]);
    }
  }, [filterTagId, includeSubtags, subtagsDaTag]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (subtagDropdownRef.current && !subtagDropdownRef.current.contains(e.target as Node)) {
        setSubtagDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const transacoesFiltradas = useMemo(() => {
    let list = transacoes;
    if (!showAll) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
      const [cy, cm, cd] = [cutoff.getFullYear(), cutoff.getMonth() + 1, cutoff.getDate()];
      const cutoffStr = `${cy}-${String(cm).padStart(2, "0")}-${String(cd).padStart(2, "0")}`;
      list = list.filter((t) => t.data >= cutoffStr);
    }
    if (filterTagId) {
      const ids = getTagIdsForFilter(
        filterTagId,
        tags,
        includeSubtags,
        includeSubtags ? selectedSubtagIds : undefined
      );
      list = list.filter((t) => t.tagIds.some((tid) => ids.includes(tid)));
    }
    if (searchDesc.trim()) {
      const q = searchDesc.trim().toLowerCase();
      list = list.filter((t) =>
        t.descricao.toLowerCase().includes(q)
      );
    }
    if (filterDataDe) {
      list = list.filter((t) => t.data >= filterDataDe);
    }
    if (filterDataAte) {
      list = list.filter((t) => t.data <= filterDataAte);
    }
    return list;
  }, [transacoes, showAll, filterTagId, tags, includeSubtags, selectedSubtagIds, searchDesc, filterDataDe, filterDataAte]);

  const totalFiltrado = useMemo(
    () => transacoesFiltradas.reduce((s, t) => s + t.valor, 0),
    [transacoesFiltradas]
  );

  const { transacoesNormais, parceladasGrupos } = useMemo(() => {
    const hoje = getLocalDateString();
    const grupos = groupParceladas(transacoesFiltradas);
    const gruposOrdenados = Array.from(grupos.entries()).sort(
      ([, a], [, b]) => (b[0]?.data ?? "").localeCompare(a[0]?.data ?? "")
    );
    const paraLista = transacoesFiltradas.filter(
      (t) => !isParcelada(t.descricao) || t.data <= hoje
    );
    return {
      transacoesNormais: paraLista,
      parceladasGrupos: gruposOrdenados,
    };
  }, [transacoesFiltradas]);

  const parceladasGruposAtivos = useMemo(() => {
    const grupos = groupParceladas(transacoes);
    const entries = Array.from(grupos.entries()).sort(
      ([, a], [, b]) => (b[0]?.data ?? "").localeCompare(a[0]?.data ?? "")
    );
    return filterGruposAtivos(entries, (t) => getDataVencimentoFatura(t, contas));
  }, [transacoes, contas]);

  const openNewForm = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const openEditForm = (t: Transacao) => {
    setEditingTransaction(t);
    setExpandedId(null);
  };

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingTransaction(null);
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm("Excluir esta transação?")) return;
    deleteTransacao(id);
  };

  const handleBulkApplyTags = () => {
    transacoesFiltradas.forEach((t) => {
      saveTransacao({ ...t, tagIds: bulkTagIds });
    });
    setBulkEditOpen(false);
    setBulkTagIds([]);
  };

  const openBulkEdit = () => {
    setBulkTagIds([]);
    setBulkEditOpen(true);
  };

  const formatBRL = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);

  const formatDate = (d: string) =>
    formatLocalDate(d, { day: "2-digit", month: "short" });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transações</h1>
          <p className="text-slate-400 mt-1">Gerencie entradas e saídas</p>
        </div>
        <button
          type="button"
          onClick={openNewForm}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 active:opacity-90 transition-colors cursor-pointer min-h-[48px] touch-target"
        >
          <Plus size={20} />
          Nova
        </button>
      </div>

      {showForm && !editingTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto"
          onClick={closeForm}
        >
          <div
            className="glass rounded-xl p-6 w-full max-w-lg my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <TransactionForm
              transacoes={transacoes}
              onSuccess={closeForm}
              showCancel
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      <div className="glass rounded-xl overflow-visible">
        <div className="p-4 border-b border-slate-700/50 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <label className="text-sm text-slate-400 shrink-0">Buscar:</label>
            <input
              type="text"
              value={searchDesc}
              onChange={(e) => setSearchDesc(e.target.value)}
              placeholder="Ex: Metro, Uber..."
              className="flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <label className="text-sm text-slate-400 shrink-0">Filtrar por tag:</label>
            <select
              value={filterTagId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setFilterTagId(v || null);
              }}
              className="flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">Todas</option>
              {tagsFlat.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {getTagPath(tag, tags)}
                </option>
              ))}
            </select>
          </div>
          {filterTagId && tagHasSubtags(filterTagId, tags) && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeSubtags}
                  onChange={(e) => setIncludeSubtags(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500/50"
                />
                <span>Incluir subtags</span>
              </label>
              {includeSubtags && subtagsDaTag.length > 0 && (
                <div className="relative" ref={subtagDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setSubtagDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 min-h-[36px] px-3 py-1.5 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700/50"
                  >
                    {selectedSubtagIds.length === subtagsDaTag.length
                      ? "Todas"
                      : `${selectedSubtagIds.length} de ${subtagsDaTag.length}`}
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${subtagDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {subtagDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSubtagDropdownOpen(false)} aria-hidden />
                      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[60vh] overflow-y-auto py-4 px-4 rounded-t-xl bg-slate-800 border-t border-slate-700 shadow-xl md:absolute md:bottom-auto md:left-0 md:right-auto md:top-full md:mt-1 md:max-h-none md:min-w-[160px] md:py-2 md:px-0 md:rounded-lg md:border md:border-slate-700">
                      {subtagsDaTag.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubtagIds(
                              selectedSubtagIds.length === subtagsDaTag.length
                                ? []
                                : subtagsDaTag.map((t) => t.id)
                            );
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-brand-400 hover:bg-slate-700/50"
                        >
                          {selectedSubtagIds.length === subtagsDaTag.length
                            ? "Desmarcar todas"
                            : "Selecionar todas"}
                        </button>
                      )}
                      {subtagsDaTag.map((st) => {
                        const checked = selectedSubtagIds.includes(st.id);
                        return (
                          <label
                            key={st.id}
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-700/50 min-w-0"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedSubtagIds((prev) =>
                                  prev.includes(st.id)
                                    ? prev.filter((id) => id !== st.id)
                                    : [...prev, st.id]
                                );
                              }}
                              className="sr-only"
                            />
                            <span className="w-4 h-4 flex items-center justify-center rounded border border-slate-600 bg-slate-900 shrink-0">
                              {checked && <Check size={12} className="text-brand-400" />}
                            </span>
                            <span className="text-sm text-slate-200 break-words min-w-0">
                              {getTagPath(st, tags)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {showAll && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <label className="text-sm text-slate-400 shrink-0">Período:</label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="date"
                  value={filterDataDe}
                  onChange={(e) => setFilterDataDe(e.target.value)}
                  className="min-h-[36px] px-3 py-2 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  placeholder="De"
                />
                <input
                  type="date"
                  value={filterDataAte}
                  onChange={(e) => setFilterDataAte(e.target.value)}
                  className="min-h-[36px] px-3 py-2 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  placeholder="Até"
                />
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 min-h-[36px] px-3 py-2 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700/50"
            >
              <ListFilter size={16} />
              {showAll ? "Ver recentes" : "Ver todas"}
            </button>
            {transacoesFiltradas.length > 0 && (
              <button
                type="button"
                onClick={openBulkEdit}
                className="flex items-center gap-2 min-h-[36px] px-3 py-2 rounded-lg text-sm text-brand-400 hover:text-brand-300 hover:bg-brand-500/10 border border-brand-500/30"
              >
                <Tags size={16} />
                Editar tags em massa ({transacoesFiltradas.length})
              </button>
            )}
            {parceladasGruposAtivos.length > 0 && (
              <button
                type="button"
                onClick={() => setParceladasModalOpen(true)}
                className="flex items-center gap-2 min-h-[36px] px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 border border-slate-600"
              >
                <ChevronDown size={16} />
                Ver parceladas ({parceladasGruposAtivos.length})
              </button>
            )}
          </div>
        </div>
        {transacoesFiltradas.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {filterTagId || searchDesc.trim()
              ? "Nenhuma transação encontrada com os filtros aplicados."
              : "Nenhuma transação ainda. Clique em \"Nova\" para começar."}
          </div>
        ) : (
          <>
          <ul className="divide-y divide-slate-700/50">
            {transacoesNormais.map((t) => {
              const isEditing = editingTransaction?.id === t.id;
              if (isEditing) {
                return (
                  <li key={t.id} className="p-4">
                    <TransactionForm
                      transaction={t}
                      transacoes={transacoes}
                      onSuccess={closeForm}
                      showCancel
                      onCancel={closeForm}
                    />
                  </li>
                );
              }
              const transacaoTags = tags.filter((tg) => t.tagIds.includes(tg.id));
              const isExpanded = expandedId === t.id;
              const temComentario = !!t.comentario?.trim();
              return (
                <li
                  key={t.id}
                  className={`transition-colors ${
                    temComentario ? "cursor-pointer" : ""
                  }`}
                >
                  <div
                    role={temComentario ? "button" : undefined}
                    tabIndex={temComentario ? 0 : undefined}
                    onClick={() =>
                      temComentario &&
                      setExpandedId(isExpanded ? null : t.id)
                    }
                    onKeyDown={(e) =>
                      temComentario &&
                      (e.key === "Enter" || e.key === " ") &&
                      (e.preventDefault(), setExpandedId(isExpanded ? null : t.id))
                    }
                    className="p-4 hover:bg-slate-800/30 active:bg-slate-800/50"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-200 truncate">
                          {t.descricao}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                          <span>{formatDate(t.data)}</span>
                          <span>•</span>
                          <span className="break-words">{t.conta}</span>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className={`font-semibold ${
                            t.valor >= 0 ? "text-brand-400" : "text-red-400"
                          }`}
                        >
                          {formatBRL(t.valor)}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditForm(t)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    {transacaoTags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 min-w-0">
                        {transacaoTags.map((tg) => (
                          <span
                            key={tg.id}
                            className="text-xs px-2.5 py-1.5 rounded-lg break-words max-w-full min-w-0 leading-snug"
                            style={{
                              backgroundColor: `${tg.cor}20`,
                              color: tg.cor,
                              border: `1px solid ${tg.cor}50`,
                            }}
                          >
                            {getTagPath(tg, tags)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isExpanded && t.comentario?.trim() && (
                    <div className="px-4 pb-4 pt-0">
                      <p className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        {t.comentario}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {filterTagId && (
            <div className="p-4 border-t border-slate-700/50 flex justify-between items-center bg-slate-800/30">
              <span className="font-medium text-slate-300">
                Total ({transacoesFiltradas.length} transações)
              </span>
              <span
                className={`font-bold text-lg ${
                  totalFiltrado >= 0 ? "text-brand-400" : "text-red-400"
                }`}
              >
                {formatBRL(totalFiltrado)}
              </span>
            </div>
          )}
          </>
        )}
      </div>

      {bulkEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setBulkEditOpen(false)}
        >
          <div
            className="glass rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              Editar tags em massa
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {transacoesFiltradas.length} transação(ões) serão atualizadas.
            </p>
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">
                Novas tags
              </label>
              <TagSubtagInput
                selectedIds={bulkTagIds}
                tags={tags}
                onCreateTag={createTag}
                onChange={setBulkTagIds}
                placeholder="Selecione as tags"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setBulkEditOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBulkApplyTags}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {parceladasModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setParceladasModalOpen(false)}
        >
          <div
            className="glass rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-slate-200">Compras parceladas</h3>
              <button
                type="button"
                onClick={() => setParceladasModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="divide-y divide-slate-700/30 overflow-y-auto flex-1 min-h-0">
              {parceladasGruposAtivos.map(([groupKey, parcelas]) => {
                const baseDesc = parcelas[0] ? parcelas[0].descricao.replace(/\s+\d+\/\d+$/, "") : "";
                const totalValor = parcelas.reduce((s, p) => s + p.valor, 0);
                const isExpanded = expandedParceladaKey === groupKey;
                const isEditing = editingTransaction && parcelas.some((p) => p.id === editingTransaction.id);
                if (isEditing && editingTransaction) {
                  return (
                    <li key={groupKey} className="p-4">
                      <TransactionForm
                        transaction={editingTransaction}
                        transacoes={transacoes}
                        onSuccess={closeForm}
                        showCancel
                        onCancel={closeForm}
                      />
                    </li>
                  );
                }
                return (
                  <li key={groupKey} className="transition-colors">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedParceladaKey(isExpanded ? null : groupKey)}
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") &&
                        (e.preventDefault(), setExpandedParceladaKey(isExpanded ? null : groupKey))
                      }
                      className="p-4 hover:bg-slate-800/30 active:bg-slate-800/50 cursor-pointer flex items-center gap-2"
                    >
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-slate-500 shrink-0" />
                      ) : (
                        <ChevronRight size={18} className="text-slate-500 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-200 break-words">{baseDesc}</p>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {parcelas.length} de {parseParcela(parcelas[0]?.descricao ?? "")?.total ?? parcelas.length} parcelas • {formatDate(parcelas[0]?.data ?? "")} • {parcelas[0]?.conta ?? ""}
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className={`font-semibold ${
                            totalValor >= 0 ? "text-brand-400" : "text-red-400"
                          }`}
                        >
                          {formatBRL(totalValor)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditForm(parcelas[0]!);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Excluir todas as ${parcelas.length} parcelas?`)) {
                              parcelas.forEach((p) => deleteTransacao(p.id));
                              if (parceladasGruposAtivos.length <= 1) setParceladasModalOpen(false);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Excluir todas"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    {isExpanded && (() => {
                      const hoje = getLocalDateString();
                      const vencimentosNaoPagos = parcelas
                        .map((p) => getDataVencimentoFatura(p, contas))
                        .filter((v) => v >= hoje);
                      const proximoVencimento = vencimentosNaoPagos.sort()[0] ?? null;
                      return (
                      <div className="border-t border-slate-700/30 bg-slate-900/30">
                        {parcelas.map((p) => {
                          const isParcelaEditing = editingTransaction?.id === p.id;
                          if (isParcelaEditing) {
                            return (
                              <div key={p.id} className="p-4 pl-12">
                                <TransactionForm
                                  transaction={p}
                                  transacoes={transacoes}
                                  onSuccess={closeForm}
                                  showCancel
                                  onCancel={closeForm}
                                />
                              </div>
                            );
                          }
                          const vencFatura = getDataVencimentoFatura(p, contas);
                          const paga = vencFatura < hoje;
                          const naFaturaAtual = !paga && proximoVencimento !== null && vencFatura === proximoVencimento;
                          return (
                            <div
                              key={p.id}
                              className={`px-4 py-3 pl-12 flex items-center justify-between gap-2 hover:bg-slate-800/20 ${paga ? "opacity-70" : ""}`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-slate-300 break-words">{p.descricao}</p>
                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                                  {formatDate(p.data)}
                                  {naFaturaAtual && (
                                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-medium">
                                      Na fatura atual
                                    </span>
                                  )}
                                  {paga && (
                                    <span className="text-emerald-500/90 text-xs font-medium">✓ Paga</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-sm font-medium ${
                                    p.valor >= 0 ? "text-brand-400" : "text-red-400"
                                  }`}
                                >
                                  {formatBRL(p.valor)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openEditForm(p)}
                                  className="p-1 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm("Excluir esta parcela?")) deleteTransacao(p.id);
                                  }}
                                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {parcelas[0] && tags.filter((tg) => parcelas[0]!.tagIds.includes(tg.id)).length > 0 && (
                          <div className="px-4 pb-3 pl-12 flex flex-wrap gap-1.5 min-w-0">
                            {tags
                              .filter((tg) => parcelas[0]!.tagIds.includes(tg.id))
                              .map((tg) => (
                                <span
                                  key={tg.id}
                                  className="text-xs px-2.5 py-1.5 rounded-lg break-words max-w-full min-w-0 leading-snug"
                                  style={{
                                    backgroundColor: `${tg.cor}20`,
                                    color: tg.cor,
                                    border: `1px solid ${tg.cor}50`,
                                  }}
                                >
                                  {getTagPath(tg, tags)}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                    })()}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
