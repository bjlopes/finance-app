"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, CreditCard } from "lucide-react";
import { useData } from "@/context/DataContext";
import type { ContaItem } from "@/context/DataContext";

export default function ContasPage() {
  const { contas, loading, saveConta, deleteConta } = useData();

  const [showForm, setShowForm] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaItem | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formCartaoCredito, setFormCartaoCredito] = useState(false);
  const [formDataFechamento, setFormDataFechamento] = useState<number>(10);

  const openNewForm = () => {
    setEditingConta(null);
    setFormNome("");
    setFormCartaoCredito(false);
    setFormDataFechamento(10);
    setShowForm(true);
  };

  const openEditForm = (conta: ContaItem) => {
    setEditingConta(conta);
    setFormNome(conta.nome);
    setFormCartaoCredito(conta.isCartaoCredito ?? false);
    setFormDataFechamento(conta.dataFechamento ?? 10);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nome = formNome.trim();
    if (!nome) return;

    const conta: ContaItem = editingConta
      ? {
          ...editingConta,
          nome,
          isCartaoCredito: formCartaoCredito,
          dataFechamento: formCartaoCredito ? formDataFechamento : undefined,
        }
      : {
          id: crypto.randomUUID(),
          nome,
          isCartaoCredito: formCartaoCredito,
          dataFechamento: formCartaoCredito ? formDataFechamento : undefined,
        };

    saveConta(conta);
    setFormNome("");
    setFormCartaoCredito(false);
    setFormDataFechamento(10);
    setShowForm(false);
    setEditingConta(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Excluir esta conta? Transações que a usam manterão o nome antigo."))
      return;
    deleteConta(id);
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
          <h1 className="text-2xl font-bold text-slate-100">Contas</h1>
          <p className="text-slate-400 mt-1">
            Gerencie as contas disponíveis nas transações
          </p>
        </div>
        <button
          type="button"
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 active:opacity-90 transition-colors cursor-pointer min-h-[44px]"
        >
          <Plus size={20} />
          Nova conta
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glass rounded-xl p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-slate-200">
            {editingConta ? "Editar conta" : "Nova conta"}
          </h2>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nome</label>
            <input
              type="text"
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              placeholder="Ex: Nubank, Dinheiro, Poupança"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cartaoCredito"
              checked={formCartaoCredito}
              onChange={(e) => setFormCartaoCredito(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="cartaoCredito" className="text-sm text-slate-400 cursor-pointer">
              Cartão de crédito
            </label>
          </div>
          {formCartaoCredito && (
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Dia de fechamento da fatura
              </label>
              <select
                value={formDataFechamento}
                onChange={(e) => setFormDataFechamento(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                  <option key={dia} value={dia}>
                    Dia {dia}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 active:opacity-90 cursor-pointer min-h-[44px]"
            >
              {editingConta ? "Salvar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingConta(null);
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
          Suas contas ({contas.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {contas.map((conta) => (
            <div
              key={conta.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700"
            >
              <span className="text-slate-200">{conta.nome}</span>
              {conta.isCartaoCredito && (
                <span
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  title={conta.dataFechamento ? `Fechamento: dia ${conta.dataFechamento}` : undefined}
                >
                  <CreditCard size={12} />
                  {conta.dataFechamento ? `Dia ${conta.dataFechamento}` : "CC"}
                </span>
              )}
              <button
                type="button"
                onClick={() => openEditForm(conta)}
                className="p-1.5 rounded text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(conta.id)}
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
