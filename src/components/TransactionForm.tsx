"use client";

import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react";
import Link from "next/link";
import { TagInput } from "@/components/TagInput";
import { CurrencyInput } from "@/components/CurrencyInput";
import { useData } from "@/context/DataContext";
import type { Transacao } from "@/types";

function parseParcela(descricao: string): { base: string; n: number; total: number } | null {
  const match = descricao.match(/^(.+?)\s+(\d+)\/(\d+)$/);
  if (!match) return null;
  return { base: match[1].trim(), n: parseInt(match[2], 10), total: parseInt(match[3], 10) };
}

function findParcelasRelacionadas(
  transacao: Transacao,
  transacoes: Transacao[]
): Transacao[] {
  const parsed = parseParcela(transacao.descricao);
  if (!parsed) return [transacao];

  return transacoes
    .filter(
      (t) =>
        t.conta === transacao.conta &&
        (() => {
          const p = parseParcela(t.descricao);
          return p && p.base === parsed.base && p.total === parsed.total;
        })()
    )
    .sort((a, b) => {
      const pa = parseParcela(a.descricao)!;
      const pb = parseParcela(b.descricao)!;
      return pa.n - pb.n;
    });
}

interface TransactionFormProps {
  transaction?: Transacao;
  transacoes?: Transacao[];
  onSuccess?: () => void;
  showCancel?: boolean;
  onCancel?: () => void;
}

const EMPTY_TRANSACTIONS: Transacao[] = [];

function distribuirValor(total: number, n: number): number[] {
  if (n <= 0) return [];
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / n);
  const resto = totalCents - baseCents * n;

  if (resto === 0) {
    const valor = baseCents / 100;
    return Array(n).fill(valor);
  }

  const valores: number[] = [];
  valores.push((baseCents + resto) / 100);
  for (let i = 1; i < n; i++) {
    valores.push(baseCents / 100);
  }
  return valores;
}

function transactionToForm(
  t: Transacao,
  parcelasRelacionadas: Transacao[] = []
) {
  const isParcelada = parcelasRelacionadas.length > 1;
  const parsed = parseParcela(t.descricao);
  const baseDesc = parsed?.base ?? t.descricao;
  const totalValor = isParcelada
    ? parcelasRelacionadas.reduce((s, p) => s + Math.abs(p.valor), 0)
    : Math.abs(t.valor);
  const valorParcelas = isParcelada
    ? parcelasRelacionadas.map((p) => Math.abs(p.valor))
    : [Math.abs(t.valor)];
  const primeiraData = isParcelada
    ? parcelasRelacionadas[0]?.data ?? t.data
    : t.data;

  return {
    descricao: baseDesc,
    valor: Math.round(totalValor * 100).toString(),
    valorParcelas,
    conta: t.conta,
    data: primeiraData,
    tagIds: t.tagIds,
    parcelada: false,
    parcelas: parsed?.total ?? 2,
    receita: t.valor >= 0,
    comentario: t.comentario ?? "",
  };
}

interface AutofillSuggestion {
  descricao: string;
  valor: number;
  tagIds: string[];
  conta: string;
}

function buildAutofillMap(transacoes: Transacao[]): Map<string, AutofillSuggestion> {
  const map = new Map<string, AutofillSuggestion>();
  for (const t of transacoes) {
    const base = (parseParcela(t.descricao)?.base ?? t.descricao).trim().toLowerCase();
    if (!base) continue;
    if (!map.has(base)) {
      map.set(base, {
        descricao: parseParcela(t.descricao)?.base ?? t.descricao,
        valor: Math.abs(t.valor),
        tagIds: t.tagIds ?? [],
        conta: t.conta,
      });
    }
  }
  return map;
}

function TransactionFormInner({
  transaction,
  transacoes = EMPTY_TRANSACTIONS,
  onSuccess,
  showCancel = false,
  onCancel,
}: TransactionFormProps) {
  const { tags, contas, saveTransacao, createTag, transacoes: allTransacoes } = useData();

  const parcelasRelacionadas = useMemo(
    () =>
      transaction && transacoes.length > 0
        ? findParcelasRelacionadas(transaction, transacoes)
        : [],
    [transaction?.id, transacoes]
  );
  const isEdicaoParcelada = parcelasRelacionadas.length > 1;

  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    valorParcelas: [] as number[],
    conta: "",
    data: new Date().toISOString().split("T")[0],
    tagIds: [] as string[],
    parcelada: false,
    parcelas: 2,
    receita: false,
    comentario: "",
  });

  const autofillMap = useMemo(
    () => buildAutofillMap(allTransacoes),
    [allTransacoes]
  );

  const [showAutofill, setShowAutofill] = useState(false);
  const [autofillIndex, setAutofillIndex] = useState(0);
  const descInputRef = useRef<HTMLInputElement>(null);
  const autofillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autofillSuggestions = useMemo(() => {
    if (!form.descricao.trim() || transaction) return [];
    const q = form.descricao.trim().toLowerCase();
    return Array.from(autofillMap.entries())
      .filter(([key]) => key.includes(q) || q.includes(key))
      .slice(0, 8)
      .map(([, v]) => v);
  }, [form.descricao, autofillMap, transaction]);

  const applyAutofill = useCallback(
    (suggestion: AutofillSuggestion) => {
      setForm((f) => ({
        ...f,
        descricao: suggestion.descricao,
        valor: Math.round(suggestion.valor * 100).toString(),
        tagIds: suggestion.tagIds,
        conta: suggestion.conta,
      }));
      setShowAutofill(false);
    },
    []
  );

  useEffect(
    () => () => {
      if (autofillTimeoutRef.current) clearTimeout(autofillTimeoutRef.current);
    },
    []
  );

  const initializedNewRef = useRef(false);
  useEffect(() => {
    if (transaction) {
      initializedNewRef.current = false;
      return;
    }
    if (initializedNewRef.current) return;
    initializedNewRef.current = true;
    setForm({
      descricao: "",
      valor: "",
      valorParcelas: [],
      conta: contas[0]?.nome ?? "",
      data: new Date().toISOString().split("T")[0],
      tagIds: [],
      parcelada: false,
      parcelas: 2,
      receita: false,
      comentario: "",
    });
  }, [transaction?.id]);

  useEffect(() => {
    if (!transaction) return;
    setForm(transactionToForm(transaction, parcelasRelacionadas));
  }, [transaction?.id, parcelasRelacionadas]);

  const mostraParcelas =
    (form.parcelada && !transaction) || isEdicaoParcelada;
  const numParcelas = isEdicaoParcelada
    ? parcelasRelacionadas.length
    : form.parcelas;

  useEffect(() => {
    if (
      form.parcelada &&
      !transaction &&
      numParcelas >= 2 &&
      (form.valorParcelas.length !== numParcelas || form.valorParcelas.length === 0)
    ) {
      const total =
        form.valorParcelas.length > 0
          ? form.valorParcelas.reduce((s, v) => s + v, 0)
          : form.valor
            ? parseInt(form.valor, 10) / 100
            : 0;
      if (total > 0) {
        setForm((f) => ({
          ...f,
          valorParcelas: distribuirValor(total, numParcelas),
        }));
      }
    }
  }, [form.parcelada, form.valor, form.parcelas, transaction, numParcelas]);

  const getDataParcela = (parcelaIndex: number): string => {
    if (parcelaIndex === 0) return form.data;
    const parts = form.data?.split("-");
    if (!parts || parts.length !== 3) return form.data;
    const [y, m, d] = parts.map(Number);
    const conta = contas.find((c) => c.nome === form.conta);

    if (conta?.isCartaoCredito && conta.dataFechamento != null) {
      const diaParcela = conta.dataFechamento + 1;
      const mesAno = new Date(y, m - 1 + parcelaIndex, 1);
      const ultimoDia = new Date(
        mesAno.getFullYear(),
        mesAno.getMonth() + 1,
        0
      ).getDate();
      const dia = Math.min(diaParcela, ultimoDia);
      return `${mesAno.getFullYear()}-${String(mesAno.getMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    }

    const mesAno = new Date(y, m - 1 + parcelaIndex, 1);
    const ultimoDia = new Date(
      mesAno.getFullYear(),
      mesAno.getMonth() + 1,
      0
    ).getDate();
    const dia = Math.min(d, ultimoDia);
    return `${mesAno.getFullYear()}-${String(mesAno.getMonth() + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valores: number[];
    if (mostraParcelas) {
      if (form.valorParcelas.length === numParcelas) {
        valores = form.valorParcelas;
      } else {
        const total = form.valor
          ? parseInt(form.valor, 10) / 100
          : form.valorParcelas.reduce((s, v) => s + v, 0);
        valores = distribuirValor(total, numParcelas);
      }
    } else {
      valores = [form.valor ? parseInt(form.valor, 10) / 100 : 0];
    }
    const totalValor = valores.reduce((s, v) => s + v, 0);

    if (!form.descricao || totalValor === 0) return;

    const sinal = form.receita ? 1 : -1;
    const parcelas = mostraParcelas ? valores.length : 1;

    const comentario = form.comentario?.trim() || undefined;
    if (form.parcelada && !transaction) {
      for (let i = 0; i < parcelas; i++) {
        const transacao: Transacao = {
          id: crypto.randomUUID(),
          descricao: `${form.descricao} ${i + 1}/${parcelas}`,
          valor: Math.round(valores[i] * 100) / 100 * sinal,
          conta: form.conta,
          data: getDataParcela(i),
          tagIds: form.tagIds,
          comentario,
        };
        saveTransacao(transacao);
      }
    } else if (isEdicaoParcelada && parcelasRelacionadas.length > 0) {
      parcelasRelacionadas.forEach((p, i) => {
        const transacao: Transacao = {
          ...p,
          descricao: `${form.descricao} ${i + 1}/${parcelasRelacionadas.length}`,
          valor: Math.round(form.valorParcelas[i] * 100) / 100 * sinal,
          conta: form.conta,
          data: getDataParcela(i),
          tagIds: form.tagIds,
          comentario,
        };
        saveTransacao(transacao);
      });
    } else {
      const transacao: Transacao = {
        id: transaction?.id ?? crypto.randomUUID(),
        descricao: form.descricao,
        valor: totalValor * sinal,
        conta: form.conta,
        data: form.data,
        tagIds: form.tagIds,
        comentario,
      };
      saveTransacao(transacao);
    }

    setForm({
      descricao: "",
      valor: "",
      valorParcelas: [],
      conta: contas[0]?.nome ?? "",
      data: new Date().toISOString().split("T")[0],
      tagIds: [],
      parcelada: false,
      parcelas: 2,
      receita: false,
      comentario: "",
    });
    onSuccess?.();
  };

  const handleCreateTag = (nome: string) => {
    return Promise.resolve(createTag(nome));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-xl p-6 space-y-4 min-w-0"
    >
      <h2 className="text-lg font-semibold text-slate-200">
        {transaction
          ? isEdicaoParcelada
            ? "Editar compra parcelada"
            : "Editar transação"
          : "Nova transação"}
      </h2>
      {isEdicaoParcelada && (
        <p className="text-sm text-slate-400">
          Editando {parcelasRelacionadas.length} parcelas. As alterações serão
          aplicadas a todas.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
        <div className="min-w-0 relative">
          <label className="block text-sm text-slate-400 mb-1">
            Descrição
          </label>
          <input
            ref={descInputRef}
            type="text"
            value={form.descricao}
            onChange={(e) => {
              setForm((f) => ({ ...f, descricao: e.target.value }));
              setShowAutofill(true);
              setAutofillIndex(0);
            }}
            onFocus={() => form.descricao.trim() && setShowAutofill(true)}
            onBlur={() => {
              autofillTimeoutRef.current = setTimeout(
                () => setShowAutofill(false),
                150
              );
            }}
            onKeyDown={(e) => {
              if (!showAutofill || autofillSuggestions.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setAutofillIndex((i) =>
                  i < autofillSuggestions.length - 1 ? i + 1 : 0
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setAutofillIndex((i) =>
                  i > 0 ? i - 1 : autofillSuggestions.length - 1
                );
              } else if (e.key === "Enter" && autofillSuggestions[autofillIndex]) {
                e.preventDefault();
                applyAutofill(autofillSuggestions[autofillIndex]);
              }
            }}
            placeholder="Ex: Uber, Petz, Salário..."
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            required
          />
          {!transaction && showAutofill && autofillSuggestions.length > 0 && (
            <ul
              className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg bg-slate-800 border border-slate-700 shadow-xl z-20 max-h-48 overflow-y-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              {autofillSuggestions.map((s, i) => (
                <li key={s.descricao}>
                  <button
                    type="button"
                    onClick={() => applyAutofill(s)}
                    onMouseDown={() => {
                      if (autofillTimeoutRef.current) {
                        clearTimeout(autofillTimeoutRef.current);
                        autofillTimeoutRef.current = null;
                      }
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      i === autofillIndex
                        ? "bg-brand-500/20 text-brand-400"
                        : "text-slate-200 hover:bg-slate-700/50"
                    }`}
                  >
                    <span className="font-medium">{s.descricao}</span>
                    <span className="text-slate-500 ml-2 text-xs">
                      R$ {s.valor.toFixed(2)} • {s.conta}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="min-w-0">
          <label className="block text-sm text-slate-400 mb-1">
            {mostraParcelas ? "Valor total" : "Valor"}
          </label>
          <div className="flex gap-2 items-center min-w-0">
            <CurrencyInput
              value={
                mostraParcelas && form.valorParcelas.length > 0
                  ? Math.round(
                      form.valorParcelas.reduce((s, v) => s + v, 0) * 100
                    ).toString()
                  : form.valor
              }
              onChange={(valor) => {
                if (mostraParcelas) {
                  const total = parseInt(valor, 10) / 100;
                  setForm((f) => ({
                    ...f,
                    valor: valor,
                    valorParcelas: distribuirValor(total, numParcelas),
                  }));
                } else {
                  setForm((f) => ({ ...f, valor }));
                }
              }}
              placeholder="0,00"
              className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              required
            />
            <label className="flex items-center gap-2 whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={form.receita}
                onChange={(e) =>
                  setForm((f) => ({ ...f, receita: e.target.checked }))
                }
                className="rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-400">Receita</span>
            </label>
          </div>
          {mostraParcelas && form.valorParcelas.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-slate-400">
                Valores por parcela (edite se necessário):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 min-w-0">
                {form.valorParcelas.map((v, i) => (
                  <div key={i} className="min-w-0">
                    <label className="block text-xs text-slate-500 mb-0.5">
                      Parcela {i + 1}
                    </label>
                    <CurrencyInput
                      value={Math.round(v * 100).toString()}
                      onChange={(valor) => {
                        const novoValor = parseInt(valor, 10) / 100;
                        setForm((f) => {
                          const nova = [...f.valorParcelas];
                          nova[i] = novoValor;
                          return {
                            ...f,
                            valorParcelas: nova,
                          };
                        });
                      }}
                      placeholder="0,00"
                      className="w-full min-w-0 px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
        <div className="min-w-0">
          <label className="block text-sm text-slate-400 mb-1">
            {isEdicaoParcelada ? "Data da 1ª parcela" : "Data"}
          </label>
          <input
            type="date"
            value={form.data}
            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm text-slate-400">Conta</label>
            <Link
              href="/contas"
              className="text-xs text-slate-500 hover:text-brand-400 transition-colors"
            >
              Editar contas
            </Link>
          </div>
          <select
                value={form.conta || contas[0]?.nome}
                onChange={(e) =>
                  setForm((f) => ({ ...f, conta: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
        </div>
      </div>
      <div className="min-w-0">
        <label className="block text-sm text-slate-400 mb-1">Tags</label>
        <TagInput
          selectedIds={form.tagIds}
          tags={tags}
          onChange={(tagIds) => {
            const temSalario = tagIds.some((id) => {
              const nome = tags.find((t) => t.id === id)?.nome.toLowerCase() ?? "";
              return nome === "salario" || nome === "salário";
            });
            setForm((f) => ({
              ...f,
              tagIds,
              receita: temSalario ? true : f.receita,
            }));
          }}
          onCreateTag={handleCreateTag}
        />
      </div>
      <div className="min-w-0">
        <label className="block text-sm text-slate-400 mb-1">
          Comentário (opcional)
        </label>
        <textarea
          value={form.comentario}
          onChange={(e) =>
            setForm((f) => ({ ...f, comentario: e.target.value }))
          }
          placeholder="Notas adicionais sobre esta transação..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
        />
      </div>
      {!transaction && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="parcelada"
              checked={form.parcelada}
              onChange={(e) =>
                setForm((f) => ({ ...f, parcelada: e.target.checked }))
              }
              className="rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="parcelada" className="text-sm text-slate-400">
              Compra parcelada
            </label>
          </div>
          {form.parcelada && (
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Em quantas vezes?
                </label>
                <select
                  value={form.parcelas <= 12 ? form.parcelas : "custom"}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({
                      ...f,
                      parcelas: v === "custom" ? 13 : parseInt(v, 10),
                    }));
                  }}
                  className="w-24 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x
                    </option>
                  ))}
                  <option value="custom">Outro</option>
                </select>
              </div>
              {form.parcelas > 12 && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Número de parcelas
                  </label>
                  <input
                    type="number"
                    min={13}
                    max={999}
                    value={form.parcelas}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) {
                        setForm((f) => ({
                          ...f,
                          parcelas: Math.max(13, Math.min(v, 999)),
                        }));
                      }
                    }}
                    className="w-20 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 active:opacity-90 cursor-pointer min-h-[44px]"
        >
          {transaction ? "Atualizar" : "Salvar"}
        </button>
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 active:opacity-90 cursor-pointer min-h-[44px]"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export const TransactionForm = memo(TransactionFormInner);
