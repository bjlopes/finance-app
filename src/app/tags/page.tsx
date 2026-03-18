"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import { useData } from "@/context/DataContext";
import {
  buildTagTree,
  canAddSubtag,
  getTagPath,
  type TagNode,
} from "@/lib/tags-utils";
import type { Tag } from "@/types";

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
  const [parentId, setParentId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    nome: string;
    cor: string;
    subtags: { id?: string; nome: string }[];
  }>({
    nome: "",
    cor: "#6b7280",
    subtags: [],
  });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const tree = buildTagTree(tags);

  const openNewForm = (parent: Tag | null = null) => {
    setEditingTag(null);
    setParentId(parent?.id ?? null);
    setForm({
      nome: "",
      cor: parent?.cor ?? "#6b7280",
      subtags: [],
    });
    setShowForm(true);
  };

  const openEditForm = (tag: Tag) => {
    setEditingTag(tag);
    setParentId(tag.parentId ?? null);
    const subtags = tags
      .filter((t) => t.parentId === tag.id)
      .map((t) => ({ id: t.id, nome: t.nome }));
    setForm({
      nome: tag.nome,
      cor: tag.cor,
      subtags,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nome = form.nome.toLowerCase().trim();
    if (!nome) return;

    const tag: Tag = editingTag
      ? { ...editingTag, nome, cor: form.cor }
      : {
          id: crypto.randomUUID(),
          nome,
          cor: form.cor,
          ...(parentId ? { parentId } : {}),
        };

    saveTag(tag);
    const parentTagId = tag.id;

    if ((!parentId && !editingTag) || (editingTag && canAddSubtag(editingTag, tags))) {
      const existingIds = new Set(
        form.subtags.filter((s) => s.id).map((s) => s.id!)
      );
      for (const s of form.subtags) {
        const nomeSub = s.nome.toLowerCase().trim();
        if (!nomeSub) continue;
        if (s.id) {
          const existing = tags.find((t) => t.id === s.id);
          if (existing && existing.nome !== nomeSub) {
            saveTag({ ...existing, nome: nomeSub });
          }
        } else {
          saveTag({
            id: crypto.randomUUID(),
            nome: nomeSub,
            cor: form.cor,
            parentId: parentTagId,
          });
        }
      }
      if (editingTag) {
        const toRemove = tags.filter(
          (t) => t.parentId === editingTag.id && !existingIds.has(t.id)
        );
        toRemove.forEach((t) => deleteTag(t.id));
      }
    }

    setForm({ nome: "", cor: "#6b7280", subtags: [] });
    setShowForm(false);
    setEditingTag(null);
    setParentId(null);
  };

  const addSubtag = () => {
    setForm((f) => ({ ...f, subtags: [...f.subtags, { nome: "" }] }));
  };

  const updateSubtag = (index: number, nome: string) => {
    setForm((f) => ({
      ...f,
      subtags: f.subtags.map((s, i) =>
        i === index ? { ...s, nome } : s
      ),
    }));
  };

  const removeSubtag = (index: number) => {
    setForm((f) => ({
      ...f,
      subtags: f.subtags.filter((_, i) => i !== index),
    }));
  };

  const handleDelete = (id: string) => {
    if (
      !confirm(
        "Excluir esta tag? Subtags e transações que a usam serão afetadas."
      )
    )
      return;
    deleteTag(id);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tagExists = (nome: string, excludeId?: string) => {
    const n = nome.toLowerCase().trim();
    return tags.some(
      (t) =>
        t.nome === n &&
        t.parentId === (parentId ?? undefined) &&
        t.id !== excludeId
    );
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
            Crie tags e subtags (até 3 níveis: tag › subtag › sub-subtag)
          </p>
        </div>
        <button
          type="button"
          onClick={() => openNewForm(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 active:opacity-90 transition-colors cursor-pointer min-h-[44px]"
        >
          <Plus size={20} />
          Nova tag
        </button>
      </div>

      {showForm && !editingTag && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowForm(false);
            setParentId(null);
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="modal-content-centered glass rounded-xl p-6 space-y-4 w-full max-w-md overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
          <h2 className="text-lg font-semibold text-slate-200">
            {parentId ? "Nova subtag" : "Nova tag"}
          </h2>
          {parentId && (() => {
            const parent = tags.find((t) => t.id === parentId);
            return parent ? (
              <p className="text-sm text-slate-400">
                Dentro de:{" "}
                <span className="text-slate-200">{getTagPath(parent, tags)}</span>
              </p>
            ) : null;
          })()}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) =>
                setForm((f) => ({ ...f, nome: e.target.value }))
              }
              placeholder="Ex: transporte, uber"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              required
            />
            {tagExists(form.nome) && (
              <p className="text-red-400 text-xs mt-1">Tag já existe neste nível</p>
            )}
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
                    form.cor === c
                      ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {!parentId && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Subtags
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Adicione subtags (nível 1). Use o botão + na árvore para adicionar nível 2.
              </p>
              <div className="space-y-2">
                {form.subtags.map((s, i) => (
                  <div
                    key={s.id ?? i}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={s.nome}
                      onChange={(e) => updateSubtag(i, e.target.value)}
                      placeholder="Nome da subtag"
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeSubtag(i)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSubtag}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:border-brand-500/50 hover:text-brand-400 text-sm"
                >
                  <Plus size={16} />
                  Adicionar subtag
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={tagExists(form.nome)}
              className="px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 active:opacity-90 cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTag(null);
                setParentId(null);
              }}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 active:opacity-90 cursor-pointer min-h-[44px]"
            >
              Cancelar
            </button>
          </div>
          </form>
        </div>
      )}

      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Suas tags ({tags.length})
        </h2>
        <TagTree
          nodes={tree}
          expandedIds={expandedIds}
          onToggle={toggleExpand}
          onEdit={openEditForm}
          onDelete={handleDelete}
          onAddSubtag={openNewForm}
          canAddSubtag={canAddSubtag}
          tags={tags}
          editingTag={editingTag}
          form={form}
          setForm={setForm}
          onFormSubmit={handleSubmit}
          addSubtag={addSubtag}
          updateSubtag={updateSubtag}
          removeSubtag={removeSubtag}
          tagExists={tagExists}
          onCancelEdit={() => {
            setShowForm(false);
            setEditingTag(null);
            setParentId(null);
          }}
        />
      </div>
    </div>
  );
}

function TagTree({
  nodes,
  expandedIds,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtag,
  canAddSubtag,
  tags,
  depth = 0,
  editingTag,
  form,
  setForm,
  onFormSubmit,
  addSubtag,
  updateSubtag,
  removeSubtag,
  tagExists,
  onCancelEdit,
}: {
  nodes: TagNode[];
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (tag: Tag) => void;
  onDelete: (id: string) => void;
  onAddSubtag: (parent: Tag) => void;
  canAddSubtag: (tag: Tag, tags: Tag[]) => boolean;
  tags: Tag[];
  depth?: number;
  editingTag: Tag | null;
  form: { nome: string; cor: string; subtags: { id?: string; nome: string }[] };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
  onFormSubmit: (e: React.FormEvent) => void;
  addSubtag: () => void;
  updateSubtag: (index: number, nome: string) => void;
  removeSubtag: (index: number) => void;
  tagExists: (nome: string, excludeId?: string) => boolean;
  onCancelEdit: () => void;
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => {
        const hasChildren = node.children.length > 0;
        const isExpanded = expandedIds.has(node.tag.id);
        const canAdd = canAddSubtag(node.tag, tags);
        const isEditing = editingTag?.id === node.tag.id;

        return (
          <li key={node.tag.id}>
            {isEditing ? (
              <form
                onSubmit={onFormSubmit}
                className="py-3 px-2 rounded-lg bg-slate-800/50 border border-slate-700 space-y-3"
                style={{ marginLeft: `${depth * 16}px` }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nome: e.target.value }))
                    }
                    placeholder="Nome"
                    className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    required
                  />
                  <div className="flex gap-1">
                    {CORES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, cor: c }))}
                        className={`w-6 h-6 rounded-full shrink-0 ${
                          form.cor === c ? "ring-2 ring-white ring-offset-1 ring-offset-slate-800" : ""
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                {canAdd && (
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">
                      Subtags {node.tag.parentId ? "(nível 2)" : "(nível 1)"}
                    </span>
                    {form.subtags.map((s, i) => (
                      <div key={s.id ?? i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={s.nome}
                          onChange={(e) => updateSubtag(i, e.target.value)}
                          placeholder="Nome"
                          className="flex-1 px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-100 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubtag(i)}
                          className="p-1 rounded text-slate-500 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSubtag}
                      className="text-xs text-brand-400 hover:text-brand-300"
                    >
                      + Adicionar subtag
                    </button>
                  </div>
                )}
                {tagExists(form.nome, editingTag?.id) && (
                  <p className="text-red-400 text-xs">Tag já existe</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={tagExists(form.nome, editingTag?.id)}
                    className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-sm font-medium disabled:opacity-50"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div
                  className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-slate-800/30 group"
                  style={{ paddingLeft: `${depth * 16 + 8}px` }}
                >
                  <button
                    type="button"
                    onClick={() => hasChildren && onToggle(node.tag.id)}
                    className="w-6 h-6 flex items-center justify-center text-slate-500 shrink-0"
                  >
                    {hasChildren ? (
                      isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )
                    ) : (
                      <span className="w-4" />
                    )}
                  </button>
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: node.tag.cor }}
                  />
                  <span className="text-slate-200 capitalize flex-1">
                    {node.tag.nome}
                  </span>
                  <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity min-w-[72px]">
                    {canAdd && (
                      <button
                        type="button"
                        onClick={() => onAddSubtag(node.tag)}
                        className="p-1.5 rounded text-slate-500 hover:text-brand-400 hover:bg-brand-500/10"
                        title="Adicionar subtag"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(node.tag)}
                      className="p-1.5 rounded text-slate-500 hover:text-brand-400 hover:bg-brand-500/10"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(node.tag.id)}
                      className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {hasChildren && isExpanded && (
                  <TagTree
                    nodes={node.children}
                    expandedIds={expandedIds}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddSubtag={onAddSubtag}
                    canAddSubtag={canAddSubtag}
                    tags={tags}
                    depth={depth + 1}
                    editingTag={editingTag}
                    form={form}
                    setForm={setForm}
                    onFormSubmit={onFormSubmit}
                    addSubtag={addSubtag}
                    updateSubtag={updateSubtag}
                    removeSubtag={removeSubtag}
                    tagExists={tagExists}
                    onCancelEdit={onCancelEdit}
                  />
                )}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
