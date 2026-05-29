import { useEffect, useState, useCallback } from "react";
import type { Purchase, BudgetSettings } from "./budget-types";

const PURCHASES_KEY = "budget.purchases.v1";
const SETTINGS_KEY = "budget.settings.v4";
const THEME_KEY = "budget.theme.v1";

const DEFAULT_SETTINGS: BudgetSettings = {
  monthly: 15000,
  weekday: 1500,
  weekend: 1500,
  other: 4000,
  users: ["Person 1", "Person 2"],
  currentUser: "Person 1",
};

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPurchases(readJSON<Purchase[]>(PURCHASES_KEY, []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeJSON(PURCHASES_KEY, purchases);
  }, [purchases, ready]);

  const add = useCallback(
    (p: Omit<Purchase, "id" | "date"> & { date?: string }) => {
      setPurchases((prev) => [
        {
          id: crypto.randomUUID(),
          date: p.date ?? new Date().toISOString(),
          amount: p.amount,
          description: p.description,
          category: p.category,
          user: p.user,
        },
        ...prev,
      ]);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const update = useCallback((id: string, patch: Partial<Purchase>) => {
    setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  return { purchases, add, remove, update, ready };
}

export function useSettings() {
  const [settings, setSettings] = useState<BudgetSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readJSON<Partial<BudgetSettings>>(SETTINGS_KEY, {});
    setSettings({ ...DEFAULT_SETTINGS, ...stored });
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeJSON(SETTINGS_KEY, settings);
  }, [settings, ready]);

  return { settings, setSettings };
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored =
      (typeof window !== "undefined" &&
        (window.localStorage.getItem(THEME_KEY) as "light" | "dark" | null)) ||
      null;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
