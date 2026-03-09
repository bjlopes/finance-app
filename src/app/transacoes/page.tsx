"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { TransactionForm } from "@/components/TransactionForm";
import { useData } from "@/context/DataContext";
import type { Transacao } from "@/types";

export default function TransacoesPage() {
  const { transacoes, tags, loading, deleteTransacao } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);
  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const transacoesFiltradas = useMemo(() => {
    if (!filterTagId) return transacoes;
    return transacoes.filter((t) => t.tagIds.includes(filterTagId));
  }, [transacoes, filterTagId]);

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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 active:opacity-90 transition-colors cursor-pointer min-h-[44px]"
        >
          <Plus size={20} />
          Nova
        </button>
      </div>

      {showForm && !editingTransaction && (
        <TransactionForm
          transacoes={transacoes}
          onSuccess={closeForm}
          showCancel
          onCancel={closeForm}
        />
      )}

      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400 mr-2">Filtrar por tag:</span>
          <button
            type="button"
            onClick={() => setFilterTagId(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              !filterTagId
                ? "bg-brand-500/30 text-brand-400 border border-brand-500/50"
                : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
            }`}
          >
            Todas
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setFilterTagId(filterTagId === tag.id ? null : tag.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                filterTagId === tag.id
                  ? "border-current"
                  : "border-slate-700 hover:text-slate-200"
              }`}
              style={
                filterTagId === tag.id
                  ? {
                      backgroundColor: `${tag.cor}25`,
                      color: tag.cor,
                      borderColor: `${tag.cor}60`,
                    }
                  : {
                      backgroundColor: "rgb(30 41 59 / 0.5)",
                      color: "rgb(148 163 184)",
                    }
              }
            >
              {tag.nome}
            </button>
          ))}
        </div>
        {transacoesFiltradas.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {filterTagId
              ? "Nenhuma transação com esta tag."
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
                    className="flex items-center justify-between gap-4 p-4 hover:bg-slate-800/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-200 truncate">
                          {t.descricao}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-slate-500">
                            {formatDate(t.data)} • {t.conta}
                          </span>
                          {transacaoTags.map((tg) => (
                            <span
                              key={tg.id}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${tg.cor}25`,
                                color: tg.cor,
                              }}
                            >
                              {tg.nome}
                            </span>
                          ))}
                        </div>
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
    </div>
  );
}
