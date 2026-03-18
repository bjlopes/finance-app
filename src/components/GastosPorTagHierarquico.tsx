"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import type { Transacao } from "@/types";
import type { Tag } from "@/types";
import { getDescendantIds, getTagPath, type TagSpendingNode } from "@/lib/tags-utils";
import { formatLocalDate } from "@/lib/dateUtils";

interface GastosPorTagHierarquicoProps {
  nodes: TagSpendingNode[];
  totalGastos: number;
  formatBRL: (n: number) => string;
  gastos: Transacao[];
  tags: Tag[];
}

function TagRow({
  node,
  depth,
  pct,
  formatBRL,
  isExpanded,
  onToggle,
  onTagClick,
}: {
  node: TagSpendingNode;
  depth: number;
  pct: number;
  formatBRL: (n: number) => string;
  isExpanded: boolean;
  onToggle: () => void;
  onTagClick: () => void;
}) {
  const temFilhos = node.children.length > 0;
  const onRowClick = temFilhos ? onToggle : onTagClick;

  return (
    <div
      className="flex items-start sm:items-center gap-2 sm:gap-3 py-1"
      style={{ paddingLeft: depth > 0 ? `${depth * 12 + 8}px` : undefined }}
    >
      {temFilhos ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
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
      <button
        type="button"
        onClick={onRowClick}
        className="flex-1 min-w-0 flex flex-col gap-1 text-left cursor-pointer hover:opacity-90 transition-opacity"
      >
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
      </button>
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
  onTagClick,
}: {
  nodes: TagSpendingNode[];
  totalGastos: number;
  formatBRL: (n: number) => string;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onTagClick: (node: TagSpendingNode) => void;
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
              onTagClick={() => onTagClick(node)}
            />
            {showChildren && temFilhos && (
              <TagTree
                nodes={node.children}
                totalGastos={totalGastos}
                formatBRL={formatBRL}
                depth={depth + 1}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onTagClick={onTagClick}
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
  gastos,
  tags,
}: GastosPorTagHierarquicoProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalNode, setModalNode] = useState<TagSpendingNode | null>(null);

  const handleTagClick = (node: TagSpendingNode) => {
    setModalNode(node);
  };

  const onToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const transacoesDaTag = modalNode
    ? gastos.filter((t) => {
        const ids = t.tagIds ?? [];
        const tagIds = [modalNode.tag.id, ...getDescendantIds(modalNode.tag.id, tags)];
        return ids.some((id) => tagIds.includes(id));
      })
    : [];

  if (nodes.length === 0) return null;

  return (
    <>
      <div className="space-y-3">
        <TagTree
          nodes={nodes}
          totalGastos={totalGastos}
          formatBRL={formatBRL}
          depth={0}
          expandedIds={expandedIds}
          onToggle={onToggle}
          onTagClick={handleTagClick}
        />
      </div>

      {modalNode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setModalNode(null)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col rounded-xl glass shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between shrink-0">
              <h4
                className="font-semibold text-slate-200 truncate"
                style={{ color: modalNode.tag.cor }}
              >
                {getTagPath(modalNode.tag, tags)}
              </h4>
              <button
                type="button"
                onClick={() => setModalNode(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0 p-4">
              {transacoesDaTag.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhuma transação</p>
              ) : (
                <ul className="space-y-2">
                  {transacoesDaTag
                    .sort((a, b) => b.data.localeCompare(a.data))
                    .map((t) => (
                      <li
                        key={t.id}
                        className="flex justify-between items-start gap-2 py-2 border-b border-slate-700/30 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-200 truncate">{t.descricao}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatLocalDate(t.data, { day: "2-digit", month: "short" })} • {t.conta}
                          </p>
                        </div>
                        <span className="text-red-400 font-medium shrink-0">
                          {formatBRL(Math.abs(t.valor))}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
              <Link
                href={`/transacoes?tag=${modalNode.tag.id}`}
                className="mt-4 block text-center text-sm text-brand-400 hover:text-brand-300"
              >
                Ver todas na página de transações →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
