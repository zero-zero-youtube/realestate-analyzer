"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, type Analysis } from "./supabase";
import type { PropertyInput, AnalysisResult } from "./calculator";

export function useAnalyses(user: User | null) {
  const [items, setItems] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = useCallback(async (
    name: string,
    input: PropertyInput,
    result: AnalysisResult,
  ): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from("analyses").insert({
      user_id: user.id,
      name: name || "無題の物件",
      input: input as unknown as Record<string, number>,
      result: result as unknown as Record<string, unknown>,
    });
    if (!error) await fetch();
    return !error;
  }, [user, fetch]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("analyses").delete().eq("id", id);
    setItems((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { items, loading, save, remove, refresh: fetch };
}
