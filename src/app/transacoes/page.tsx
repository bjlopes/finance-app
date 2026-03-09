"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TagInput } from "@/components/TagInput";
import type { Transacao, Tag } from "@/types";

const CONTAS = ["Nubank", "Dinheiro", "Casa", "Alimentação"];

export default function TransacoesPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    conta: "Nubank",
    data: new Date().toISOString().split("T")[0],
    tagIds: [] as string[],
    recorrente: false,
  });

  const load = () => {
    Promise.all([
      fetch("/api/transacoes").then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
    ])
      .then(([t, tg]) => {
        setTransacoes(t);
        setTags(tg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(form.valor.replace(",", "."));
    if (!form.descricao || isNaN(valor)) return;

    fetch("/api/transacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao: form.descricao,
        valor: valor < 0 ? valor : -valor,
        conta: form.conta,
        data: form.data,
        tagIds: form.tagIds,
        recorrente: form.recorrente,
      }),
    })
      .then((r) => r.json())
      .then(() => {
        setForm({
          descricao: "",
          valor: "",
          conta: "Nubank",
          data: new Date().toISOString().split("T")[0],
          tagIds: [],
          recorrente: false,
        });
        setShowForm(false);
        load();
      });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Excluir esta transação?")) return;
    fetch(`/api/transacoes?id=${id}`, { method: "DELETE" }).then(load);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transações</h1>
          <p className="text-slate-400 mt-1">Gerencie entradas e saídas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={20} />
          Nova
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glass rounded-xl p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-200">
            Nova transação
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descricao: e.target.value }))
                }
                placeholder="Ex: Uber, Petz, Salário..."
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Valor (negativo = gasto)
              </label>
              <input
                type="text"
                value={form.valor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, valor: e.target.value }))
                }
                placeholder="-172,34 ou 14000"
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Data</label>
              <input
                type="date"
                value={form.data}
                onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Conta</label>
              <select
                value={form.conta}
                onChange={(e) =>
                  setForm((f) => ({ ...f, conta: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                {CONTAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tags</label>
            <TagInput
              selectedIds={form.tagIds}
              tags={tags}
              onChange={(tagIds) => setForm((f) => ({ ...f, tagIds }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recorrente"
              checked={form.recorrente}
              onChange={(e) =>
                setForm((f) => ({ ...f, recorrente: e.target.checked }))
              }
              className="rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="recorrente" className="text-sm text-slate-400">
              Gastos recorrentes (assinatura, etc.)
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="glass rounded-xl overflow-hidden">
        {transacoes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Nenhuma transação ainda. Clique em &quot;Nova&quot; para começar.
          </div>
        ) : (
          <ul className="divide-y divide-slate-700/50">
            {transacoes.map((t) => {
              const transacaoTags = tags.filter((tg) => t.tagIds.includes(tg.id));
              return (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
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
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        t.valor >= 0 ? "text-brand-400" : "text-red-400"
                      }`}
                    >
                      {formatBRL(t.valor)}
                    </span>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
