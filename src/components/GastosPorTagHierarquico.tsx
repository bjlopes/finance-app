"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TagSpendingNode } from "@/lib/tags-utils";

interface GastosPorTagHierarquicoProps {
  nodes: TagSpendingNode[];
  totalGastos: number;
  formatBRL: (n: number) => string;
}

function TagRow({
  node,
  depth,
  pct,
  formatBRL,
  isExpanded,
  onToggle,
}: {
  node: TagSpendingNode;
  depth: number;
  pct: number;
  formatBRL: (n: number) => string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const temFilhos = node.children.length > 0;

  return (
    <div
      className="flex items-start sm:items-center gap-2 sm:gap-3 py-1"
      style={{ paddingLeft: depth > 0 ? `${depth * 12 + 8}px` : undefined }}
    >
      {temFilhos ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex-shrink-0 text-slate-500 hover:text-slate-300 p-1.5 -ml-0.5 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation rounded"
          aria-label={isExpanded ? "Recolher" : "Expandir"}
        >
          {isExpanded ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>
      ) : (
        <span className="w-[36px] shrink-0" />
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-2">
          <span
            className="text-slate-300 capitalize break-words"
            style={{
              fontWeight: depth === 0 ? 500 : 400,
              fontSize: depth > 0 ? "0.9em" : undefined,
              color: depth > 0 ? "rgb(148 163 184)" : undefined,
            }}
          >
            {node.tag.nome}
          </span>
          <span className="text-slate-200 font-medium shrink-0 text-sm">
            {formatBRL(node.total)}
            <span className="text-slate-500 font-normal text-xs ml-1">
              ({pct.toFixed(0)}%)
            </span>
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: `${node.tag.cor}99` || "rgb(99 102 241 / 0.6)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TagTree({
  nodes,
  totalGastos,
  formatBRL,
  depth,
  expandedIds,
  onToggle,
}: {
  nodes: TagSpendingNode[];
  totalGastos: number;
  formatBRL: (n: number) => string;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        const pct = totalGastos > 0 ? (node.total / totalGastos) * 100 : 0;
        const temFilhos = node.children.length > 0;
        const isExpanded = expandedIds.has(node.tag.id);

        const showChildren = !temFilhos || isExpanded;

        return (
          <div key={node.tag.id} className="space-y-3">
            <TagRow
              node={node}
              depth={depth}
              pct={pct}
              formatBRL={formatBRL}
              isExpanded={isExpanded}
              onToggle={() => onToggle(node.tag.id)}
            />
            {showChildren && temFilhos && (
              <TagTree
                nodes={node.children}
                totalGastos={totalGastos}
                formatBRL={formatBRL}
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function GastosPorTagHierarquico({
  nodes,
  totalGastos,
  formatBRL,
}: GastosPorTagHierarquicoProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const onToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (nodes.length === 0) return null;

  return (
    <div className="space-y-3">
      <TagTree
        nodes={nodes}
        totalGastos={totalGastos}
        formatBRL={formatBRL}
        depth={0}
        expandedIds={expandedIds}
        onToggle={onToggle}
      />
    </div>
  );
}
