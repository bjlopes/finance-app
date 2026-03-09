"use client";

import type { Transacao, Tag } from "@/types";
import type { ContaItem } from "@/context/DataContext";
import { supabase } from "./supabase";

export interface UserData {
  transacoes: Transacao[];
  tags: Tag[];
  contas: ContaItem[];
}

export async function fetchUserData(userId: string): Promise<UserData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_data")
    .select("transacoes, tags, contas")
    .eq("user_id", userId)
    .single();
  if (error || !data) return null;
  return {
    transacoes: (data.transacoes as Transacao[]) ?? [],
    tags: (data.tags as Tag[]) ?? [],
    contas: (data.contas as ContaItem[]) ?? [],
  };
}

export async function saveUserData(
  userId: string,
  data: UserData
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("user_data")
    .upsert(
      {
        user_id: userId,
        transacoes: data.transacoes,
        tags: data.tags,
        contas: data.contas,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  return !error;
}
