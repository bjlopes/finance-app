"use client";

import { useRef } from "react";
import Link from "next/link";
import { Download, Upload, Shield } from "lucide-react";
import { useData } from "@/context/DataContext";
import * as store from "@/lib/store";

export default function BackupPage() {
  const { load, importAndSync } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = store.exportBackup();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = store.importBackup(text);
      if (result.ok) {
        const data = {
          transacoes: store.getTransacoes(),
          tags: store.getTags(),
          contas: store.getContas(),
        };
        await importAndSync(data);
        alert("Backup restaurado com sucesso!");
      } else {
        alert(result.error ?? "Erro ao importar");
      }
    } catch {
      alert("Erro ao ler o arquivo");
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Backup dos dados</h1>
        <p className="text-slate-400 mt-1">
          Exporte ou restaure seus dados para não perder nada
        </p>
      </div>

      <div className="glass rounded-xl p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <Download size={20} />
            Exportar backup
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Salve um arquivo com todos os seus dados. No iPhone, escolha
            &quot;Salvar em Arquivos&quot; e salve na pasta do iCloud para ter
            o backup na nuvem.
          </p>
          <p className="text-xs text-slate-500 mb-2">
            Alternativa:{" "}
            <a href="/backup-export.html" className="text-brand-400 hover:underline">
              /backup-export.html
            </a>{" "}
            (exporta direto ao abrir)
          </p>
          <button
            type="button"
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
          >
            <Download size={20} />
            Baixar backup
          </button>
        </div>

        <div className="border-t border-slate-700/50 pt-6">
          <h2 className="font-semibold text-slate-200 mb-2">Backup inicial</h2>
          <p className="text-sm text-slate-400 mb-3">
            Baixe o arquivo de backup completo (tags, contas e transações de exemplo).
          </p>
          <a
            href="/financas-backup-inicial.json"
            download="financas-backup-inicial.json"
            className="block w-full text-center py-2 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800/50 mb-6"
          >
            Baixar backup inicial
          </a>
        </div>

        <div className="border-t border-slate-700/50 pt-6">
          <h2 className="font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <Upload size={20} />
            Restaurar backup
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Selecione um arquivo de backup (.json) para restaurar seus dados.
            Os dados atuais serão substituídos.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-700 text-slate-200 font-medium hover:bg-slate-600 transition-colors"
          >
            <Upload size={20} />
            Escolher arquivo
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <Shield size={24} className="text-brand-500 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-400">
          <p className="font-medium text-slate-300 mb-1">Dica para iPhone</p>
          <p>
            Faça um backup periodicamente e salve em &quot;Arquivos&quot; →
            &quot;iCloud Drive&quot;. Assim seus dados ficam seguros mesmo se
            limpar o navegador.
          </p>
        </div>
      </div>

      <p className="text-center">
        <Link href="/" className="text-slate-500 hover:text-slate-400 text-sm">
          Voltar ao início
        </Link>
      </p>
    </div>
  );
}
