"use client";

import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import type { Tag } from "@/types";

interface TagInputProps {
  selectedIds: string[];
  tags: Tag[];
  onChange: (tagIds: string[]) => void;
  onCreateTag?: (nome: string) => Promise<Tag>;
  placeholder?: string;
}

export function TagInput({
  selectedIds,
  tags,
  onChange,
  onCreateTag,
  placeholder = "Adicionar tags...",
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const inputTrimmed = input.toLowerCase().trim();
  const tagExists = tags.some((t) => t.nome === inputTrimmed);
  const canCreate = onCreateTag && inputTrimmed.length >= 2 && !tagExists;

  const filteredTags = tags.filter(
    (t) =>
      t.nome.includes(inputTrimmed) &&
      !selectedIds.includes(t.id)
  );

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));

  const addTag = (tag: Tag) => {
    onChange([...selectedIds, tag.id]);
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (id: string) => {
    onChange(selectedIds.filter((tid) => tid !== id));
  };

  const handleCreateTag = async () => {
    if (!canCreate || !onCreateTag) return;
    setCreating(true);
    try {
      const newTag = await onCreateTag(inputTrimmed);
      addTag(newTag);
    } catch {
      alert("Erro ao criar tag. Tente novamente.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700 min-h-[42px]">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${tag.cor}30`,
              color: tag.cor,
              border: `1px solid ${tag.cor}60`,
            }}
          >
            {tag.nome}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                removeTag(tag.id);
              }}
              className="hover:opacity-80 ml-0.5 cursor-pointer"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canCreate) {
              e.preventDefault();
              handleCreateTag();
            }
          }}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        />
      </div>
      {showSuggestions && (inputTrimmed || filteredTags.length > 0 || canCreate) && (
        <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg bg-slate-800 border border-slate-700 shadow-xl z-20 max-h-48 overflow-y-auto">
          {filteredTags.slice(0, 8).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                addTag(tag);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.cor }}
              />
              {tag.nome}
            </button>
          ))}
          {canCreate && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleCreateTag();
              }}
              disabled={creating}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700/50 flex items-center gap-2 cursor-pointer text-brand-400 border-t border-slate-700 mt-1 pt-2"
            >
              <Plus size={16} />
              {creating ? "Criando..." : `Criar "${inputTrimmed}"`}
            </button>
          )}
          {filteredTags.length === 0 && !canCreate && inputTrimmed && (
            <div className="px-3 py-2 text-slate-500 text-sm">
              {inputTrimmed.length < 2
                ? "Digite pelo menos 2 caracteres para criar"
                : "Tag já existe"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
