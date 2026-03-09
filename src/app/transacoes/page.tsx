"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Plus, Trash2, Pencil, ChevronDown, Check, Tags, ListFilter } from "lucide-react";
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
import type { Transacao } from "@/types";

export default function TransacoesPage() {
  const { transacoes, tags, loading, deleteTransacao, saveTransacao, createTag } = useData();
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
      const cutoffStr = cutoff.toISOString().split("T")[0];
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
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });

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
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-700/50"
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
                            <span className="text-sm text-slate-200 truncate">
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
            {transacoesFiltradas.map((t) => {
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
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {transacaoTags.map((tg) => (
                          <span
                            key={tg.id}
                            className="text-xs px-2.5 py-1 rounded-md"
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
    </div>
  );
}
