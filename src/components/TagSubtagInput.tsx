"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";
import type { Tag } from "@/types";
import { getTagPath } from "@/lib/tags-utils";

interface TagSubtagInputProps {
  selectedIds: string[];
  tags: Tag[];
  onChange: (tagIds: string[]) => void;
  onCreateTag?: (nome: string, parentId?: string, cor?: string) => Tag;
  placeholder?: string;
}

const parentTags = (tags: Tag[]) => tags.filter((t) => !t.parentId);
const subtagsOf = (tags: Tag[], parentId: string) =>
  tags.filter((t) => t.parentId === parentId);

function TagCombobox({
  value,
  onChange,
  options,
  placeholder,
  onCreate,
  creating,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Tag[];
  placeholder: string;
  onCreate?: (inputValue: string) => void;
  creating: boolean;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const q = input.toLowerCase().trim();
  const filtered = options.filter((t) => t.nome.toLowerCase().includes(q));
  const canCreate =
    !!onCreate &&
    q.length >= 2 &&
    !options.some((t) => t.nome.toLowerCase() === q);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value ? options.find((t) => t.id === value)?.nome ?? "" : input;

  const clearSelection = () => {
    onChange("");
    setInput("");
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-[100px]">
      <input
        type="text"
        value={value ? displayValue : input}
        onChange={(e) => {
          const v = e.target.value;
          if (value) clearSelection();
          setInput(v);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {open && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg bg-slate-800 border border-slate-700 shadow-xl z-30 max-h-40 overflow-y-auto">
          {filtered.slice(0, 6).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onChange(t.id);
                setInput("");
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700/50 text-slate-200"
            >
              {t.nome}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onClick={() => {
                onCreate?.(q);
                setInput("");
                setOpen(false);
              }}
              disabled={creating}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700/50 flex items-center gap-2 text-brand-400 border-t border-slate-700 mt-1 pt-2"
            >
              <Plus size={14} />
              {creating ? "Criando..." : `Criar "${q}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TagSubtagInput({
  selectedIds,
  tags,
  onChange,
  onCreateTag,
  placeholder = "Tag e subtag (opcional)",
}: TagSubtagInputProps) {
  const [tagId, setTagId] = useState("");
  const [subtagId, setSubtagId] = useState("");
  const [subsubtagId, setSubsubtagId] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);

  const parents = parentTags(tags);
  const subtags = tagId ? subtagsOf(tags, tagId) : [];
  const subsubtags = subtagId ? subtagsOf(tags, subtagId) : [];

  const parentTag = tagId ? tags.find((t) => t.id === tagId) : null;
  const subtagTag = subtagId ? tags.find((t) => t.id === subtagId) : null;

  const resolveId = () => subsubtagId || subtagId || tagId || "";

  const addSelection = () => {
    const id = resolveId();
    if (!id || selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
    setTagId("");
    setSubtagId("");
    setSubsubtagId("");
    setShowAdd(false);
  };

  const removeSelection = (id: string) => {
    onChange(selectedIds.filter((tid) => tid !== id));
  };

  const createAndSelect = (
    nome: string,
    parentId?: string,
    cor?: string
  ) => {
    if (!onCreateTag || !nome.trim()) return;
    setCreating(true);
    try {
      const newTag = onCreateTag(nome.trim().toLowerCase(), parentId, cor);
      if (!parentId) {
        setTagId(newTag.id);
        setSubtagId("");
        setSubsubtagId("");
      } else if (parentId === tagId) {
        setSubtagId(newTag.id);
        setSubsubtagId("");
      } else {
        setSubsubtagId(newTag.id);
      }
    } finally {
      setCreating(false);
    }
  };

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700 min-h-[42px] min-w-0">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium break-words max-w-full min-w-0"
            style={{
              backgroundColor: `${tag.cor}30`,
              color: tag.cor,
              border: `1px solid ${tag.cor}60`,
            }}
          >
            <span className="break-words min-w-0">{getTagPath(tag, tags)}</span>
            <button
              type="button"
              onClick={() => removeSelection(tag.id)}
              className="hover:opacity-80 ml-0.5 cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        {!showAdd ? (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 text-sm border border-dashed border-slate-600"
          >
            <Plus size={14} />
            Adicionar tag
          </button>
        ) : (
          <div className="w-full p-3 rounded-lg bg-slate-800/80 border border-slate-600 space-y-2">
            <p className="text-xs text-slate-500">
              Digite para buscar ou criar (tag, subtag ou sub-subtag):
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <TagCombobox
                value={tagId}
                onChange={(id) => {
                  setTagId(id);
                  setSubtagId("");
                  setSubsubtagId("");
                }}
                options={parents}
                placeholder="1. Tag"
                creating={creating}
                disabled={false}
                onCreate={(nome) => nome && createAndSelect(nome)}
              />
              <span className="text-slate-500 text-sm shrink-0">›</span>
              <TagCombobox
                value={subtagId}
                onChange={(id) => {
                  setSubtagId(id);
                  setSubsubtagId("");
                }}
                options={subtags}
                placeholder="2. Subtag"
                creating={creating}
                disabled={!tagId}
                onCreate={(nome) =>
                  nome && tagId && createAndSelect(nome, tagId, parentTag?.cor)
                }
              />
              <span className="text-slate-500 text-sm shrink-0">›</span>
              <TagCombobox
                value={subsubtagId}
                onChange={setSubsubtagId}
                options={subsubtags}
                placeholder="3. Sub-subtag"
                creating={creating}
                disabled={!subtagId}
                onCreate={(nome) =>
                  nome && subtagId && createAndSelect(nome, subtagId, subtagTag?.cor)
                }
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={addSelection}
                disabled={!tagId}
                className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setTagId("");
                  setSubtagId("");
                  setSubsubtagId("");
                }}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
