"use client";

import { useState, useRef, useEffect } from "react";
import type { Tag } from "@/types";

interface TagInputProps {
  selectedIds: string[];
  tags: Tag[];
  onChange: (tagIds: string[]) => void;
  placeholder?: string;
}

export function TagInput({
  selectedIds,
  tags,
  onChange,
  placeholder = "Adicionar tags...",
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTags = tags.filter(
    (t) =>
      t.nome.includes(input.toLowerCase()) &&
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
              onClick={() => removeTag(tag.id)}
              className="hover:opacity-80 ml-0.5"
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
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        />
      </div>
      {showSuggestions && (input || filteredTags.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg bg-slate-800 border border-slate-700 shadow-xl z-10 max-h-48 overflow-y-auto">
          {filteredTags.slice(0, 8).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-700/50 flex items-center gap-2"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.cor }}
              />
              {tag.nome}
            </button>
          ))}
          {filteredTags.length === 0 && input && (
            <div className="px-3 py-2 text-slate-500 text-sm">
              Nenhuma tag encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}
