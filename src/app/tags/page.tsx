"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useData } from "@/context/DataContext";
import type { Tag } from "@/types";

const TIPOS: Tag["tipo"][] = [
  "contexto",
  "frequencia",
  "regra",
  "projeto",
  "custom",
];

const CORES = [
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#10b981",
  "#ec4899",
  "#6b7280",
  "#22c55e",
  "#f97316",
];

export default function TagsPage() {
  const { tags, loading, saveTag, deleteTag } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [form, setForm] = useState({
    nome: "",
    tipo: "contexto" as Tag["tipo"],
    cor: "#6b7280",
  });

  const openNewForm = () => {
    setEditingTag(null);
    setForm({ nome: "", tipo: "contexto", cor: "#6b7280" });
    setShowForm(true);
  };

  const openEditForm = (tag: Tag) => {
    setEditingTag(tag);
    setForm({ nome: tag.nome, tipo: tag.tipo, cor: tag.cor });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nome = form.nome.toLowerCase().trim();
    if (!nome) return;

    const tag: Tag = editingTag
      ? { ...editingTag, nome, tipo: form.tipo, cor: form.cor }
      : {
          id: crypto.randomUUID(),
          nome,
          tipo: form.tipo,
          cor: form.cor,
        };

    saveTag(tag);
    setForm({ nome: "", tipo: "contexto", cor: "#6b7280" });
    setShowForm(false);
    setEditingTag(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Excluir esta tag? Transações que a usam ficarão sem ela."))
      return;
    deleteTag(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-pulse text-slate-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tags</h1>
          <p className="text-slate-400 mt-1">
            Gerencie e edite suas tags
          </p>
        </div>
        <button
          type="button"
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 active:opacity-90 transition-colors cursor-pointer min-h-[44px]"
        >
          <Plus size={20} />
          Nova tag
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glass rounded-xl p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-200">
            {editingTag ? "Editar tag" : "Nova tag"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome: e.target.value }))
                }
                placeholder="Ex: transporte, alimentação"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tipo: e.target.value as Tag["tipo"],
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, cor: c }))}
                  className={`w-8 h-8 rounded-full transition-transform cursor-pointer ${
                    form.cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 active:opacity-90 cursor-pointer min-h-[44px]"
            >
              {editingTag ? "Salvar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTag(null);
              }}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 active:opacity-90 cursor-pointer min-h-[44px]"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Suas tags ({tags.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.cor }}
              />
              <span className="text-slate-200 capitalize">{tag.nome}</span>
              <span className="text-xs text-slate-500">({tag.tipo})</span>
              <button
                type="button"
                onClick={() => openEditForm(tag)}
                className="p-1.5 rounded text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(tag.id)}
                className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
