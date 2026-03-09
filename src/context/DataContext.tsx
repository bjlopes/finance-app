"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { Transacao, Tag } from "@/types";
import * as store from "@/lib/store";
import {
  fetchUserData,
  saveUserData,
  type UserData,
} from "@/lib/store-remote";
import { useAuth } from "@/context/AuthContext";

export interface ContaItem {
  id: string;
  nome: string;
  isCartaoCredito?: boolean;
  dataFechamento?: number;
}

interface DataContextValue {
  transacoes: Transacao[];
  tags: Tag[];
  contas: ContaItem[];
  loading: boolean;
  load: () => void;
  saveTransacao: (t: Transacao) => void;
  deleteTransacao: (id: string) => void;
  saveTag: (t: Tag) => Tag;
  deleteTag: (id: string) => void;
  createTag: (nome: string, parentId?: string, cor?: string) => Tag;
  saveConta: (c: ContaItem) => void;
  deleteConta: (id: string) => void;
  loadSampleData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [contas, setContas] = useState<ContaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const persistToRemote = useCallback(
    async (data: UserData) => {
      if (user) await saveUserData(user.id, data);
    },
    [user]
  );

  const load = useCallback(async () => {
    try {
      if (user) {
        const data = await fetchUserData(user.id);
        const localData = {
          transacoes: store.getTransacoes(),
          tags: store.getTags(),
          contas: store.getContas(),
        };
        const hasRemoteData =
          data &&
          (data.transacoes.length > 0 || data.tags.length > 0 || data.contas.length > 0);
        const hasLocalData =
          localData.transacoes.length > 0 ||
          localData.tags.length > 0 ||
          localData.contas.length > 0;

        if (hasRemoteData) {
          const tagsToUse = data!.tags.length ? data!.tags : store.getTags();
          const contasToUse = data!.contas.length ? data!.contas : store.getContas();
          store.setFullData({
            transacoes: data!.transacoes,
            tags: tagsToUse,
            contas: contasToUse,
          });
          setTransacoes(data!.transacoes);
          setTags(tagsToUse);
          setContas(contasToUse);
        } else if (hasLocalData) {
          await persistToRemote(localData);
          setTransacoes(localData.transacoes);
          setTags(localData.tags);
          setContas(localData.contas);
        } else {
          setTransacoes(store.getTransacoes());
          setTags(store.getTags());
          setContas(store.getContas());
        }
      } else {
        setTransacoes(store.getTransacoes());
        setTags(store.getTags());
        setContas(store.getContas());
      }
      store.saveAutoBackup();
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      setTransacoes(store.getTransacoes());
      setTags(store.getTags());
      setContas(store.getContas());
      store.saveAutoBackup();
    } finally {
      setLoading(false);
    }
  }, [user, persistToRemote]);

  useEffect(() => {
    if (authLoading) return;
    load();
    const fallback = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(fallback);
  }, [authLoading, user?.id, load]);

  const saveTransacao = useCallback(
    (t: Transacao) => {
      store.saveTransacao(t);
      const next = store.getTransacoes();
      setTransacoes(next);
      persistToRemote({
        transacoes: next,
        tags: store.getTags(),
        contas: store.getContas(),
      });
    },
    [persistToRemote]
  );

  const deleteTransacao = useCallback(
    (id: string) => {
      store.deleteTransacao(id);
      const next = store.getTransacoes();
      setTransacoes(next);
      persistToRemote({
        transacoes: next,
        tags: store.getTags(),
        contas: store.getContas(),
      });
    },
    [persistToRemote]
  );

  const saveTag = useCallback(
    (tag: Tag): Tag => {
      store.saveTag(tag);
      const next = store.getTags();
      setTags(next);
      persistToRemote({
        transacoes: store.getTransacoes(),
        tags: next,
        contas: store.getContas(),
      });
      return tag;
    },
    [persistToRemote]
  );

  const deleteTag = useCallback(
    (id: string) => {
      store.deleteTag(id);
      const next = store.getTags();
      setTags(next);
      persistToRemote({
        transacoes: store.getTransacoes(),
        tags: next,
        contas: store.getContas(),
      });
    },
    [persistToRemote]
  );

  const createTag = useCallback(
    (nome: string, parentId?: string, cor = "#6b7280"): Tag => {
      const tag: Tag = {
        id: crypto.randomUUID(),
        nome: nome.toLowerCase().trim(),
        cor,
        ...(parentId ? { parentId } : {}),
      };
      store.saveTag(tag);
      const next = store.getTags();
      setTags(next);
      persistToRemote({
        transacoes: store.getTransacoes(),
        tags: next,
        contas: store.getContas(),
      });
      return tag;
    },
    [persistToRemote]
  );

  const saveConta = useCallback(
    (conta: ContaItem) => {
      store.saveConta(conta);
      const next = store.getContas();
      setContas(next);
      persistToRemote({
        transacoes: store.getTransacoes(),
        tags: store.getTags(),
        contas: next,
      });
    },
    [persistToRemote]
  );

  const deleteConta = useCallback(
    (id: string) => {
      store.deleteConta(id);
      const next = store.getContas();
      setContas(next);
      persistToRemote({
        transacoes: store.getTransacoes(),
        tags: store.getTags(),
        contas: next,
      });
    },
    [persistToRemote]
  );

  const loadSampleData = useCallback(() => {
    store.loadSampleData();
    const t = store.getTransacoes();
    const g = store.getTags();
    const c = store.getContas();
    setTransacoes(t);
    setTags(g);
    setContas(c);
    persistToRemote({ transacoes: t, tags: g, contas: c });
  }, [persistToRemote]);

  const value = useMemo(
    () => ({
      transacoes,
      tags,
      contas,
      loading,
      load,
      saveTransacao,
      deleteTransacao,
      saveTag,
      deleteTag,
      createTag,
      saveConta,
      deleteConta,
      loadSampleData,
    }),
    [
      transacoes,
      tags,
      contas,
      loading,
      load,
      saveTransacao,
      deleteTransacao,
      saveTag,
      deleteTag,
      createTag,
      saveConta,
      deleteConta,
      loadSampleData,
    ]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
