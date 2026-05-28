"use client";

import { useState, useEffect, useCallback } from "react";
import type { PropertyInput, AnalysisResult } from "./calculator";

export interface SavedProperty {
  id: string;
  name: string;
  savedAt: string;
  input: PropertyInput;
  result: AnalysisResult;
}

const KEY = "realestate_saved_v1";
const MAX = 10;

function load(): SavedProperty[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(items: SavedProperty[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useSavedProperties() {
  const [items, setItems] = useState<SavedProperty[]>([]);

  useEffect(() => {
    setItems(load());
  }, []);

  const add = useCallback((name: string, input: PropertyInput, result: AnalysisResult): boolean => {
    const current = load();
    if (current.length >= MAX) return false;
    const next = [
      {
        id: `${Date.now()}`,
        name: name || `物件 ${current.length + 1}`,
        savedAt: new Date().toLocaleDateString("ja-JP"),
        input,
        result,
      },
      ...current,
    ];
    save(next);
    setItems(next);
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    const next = load().filter((p) => p.id !== id);
    save(next);
    setItems(next);
  }, []);

  return { items, add, remove, count: items.length };
}
