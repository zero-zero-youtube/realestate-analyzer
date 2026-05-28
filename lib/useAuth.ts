"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期セッション取得
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // セッション変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, loading, signOut };
}

// ---- 1日の分析回数制限（未ログイン：3件/日）----
const LIMIT_KEY_PREFIX = "realestate_daily_";
const DAILY_LIMIT = 3;

export function getDailyUsage(): { count: number; key: string } {
  if (typeof window === "undefined") return { count: 0, key: "" };
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = LIMIT_KEY_PREFIX + today;
  const count = parseInt(localStorage.getItem(key) ?? "0", 10);
  return { count, key };
}

export function incrementDailyUsage() {
  const { count, key } = getDailyUsage();
  if (key) localStorage.setItem(key, String(count + 1));
}

export function isLimitReached(): boolean {
  const { count } = getDailyUsage();
  return count >= DAILY_LIMIT;
}
