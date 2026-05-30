import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Purchase, BudgetSettings } from "./budget-types";

const THEME_KEY = "budget.theme.v1";

const DEFAULT_SETTINGS: BudgetSettings = {
  monthly: 15000,
  weekday: 1500,
  weekend: 1500,
  other: 4000,
  payday: 27,
  users: ["Matilda", "Jonathan"],
  currentUser: "Matilda",
};

/* ------------------------- hushålls-ID från URL ------------------------- */

export function useHouseholdId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    let h = url.searchParams.get("h");
    const stored = window.localStorage.getItem("budget.householdId");

    (async () => {
      if (!h && stored) {
        h = stored;
        url.searchParams.set("h", h);
        window.history.replaceState({}, "", url.toString());
      }
      if (!h) {
        const { data, error } = await supabase
          .from("households")
          .insert({})
          .select("id")
          .single();
        if (error || !data) {
          console.error("Kunde inte skapa hushåll", error);
          return;
        }
        h = (data as { id: string }).id;
        url.searchParams.set("h", h);
        window.history.replaceState({}, "", url.toString());
      }
      window.localStorage.setItem("budget.householdId", h);
      setId(h);
    })();
  }, []);

  return id;
}

/* ----------------------------- purchases ----------------------------- */

interface DbPurchase {
  id: string;
  household_id: string;
  amount: number | string;
  description: string;
  category: string;
  user_name: string | null;
  date: string;
}

function toPurchase(row: DbPurchase): Purchase {
  return {
    id: row.id,
    amount: Number(row.amount),
    description: row.description,
    category: (row.category === "Mat" ? "Mat" : "Övrigt") as Purchase["category"],
    user: row.user_name ?? undefined,
    date: row.date,
  };
}

export function usePurchases(householdId: string | null) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("household_id", householdId)
        .order("date", { ascending: false });
      if (!active) return;
      if (error) console.error(error);
      setPurchases((data ?? []).map((r: DbPurchase) => toPurchase(r)));
      setReady(true);
    })();

    const ch = (supabase
      .channel(`purchases-${householdId}`) as unknown as { on: (...args: unknown[]) => { subscribe: () => unknown } })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchases", filter: `household_id=eq.${householdId}` },
        (payload: { eventType: string; new: DbPurchase; old: { id?: string } }) => {
          setPurchases((prev) => {
            if (payload.eventType === "INSERT") {
              const row = toPurchase(payload.new as DbPurchase);
              if (prev.some((p) => p.id === row.id)) return prev;
              return [row, ...prev].sort((a, b) => +new Date(b.date) - +new Date(a.date));
            }
            if (payload.eventType === "UPDATE") {
              const row = toPurchase(payload.new as DbPurchase);
              return prev.map((p) => (p.id === row.id ? row : p));
            }
            if (payload.eventType === "DELETE") {
              const oldRow = payload.old as { id?: string };
              return prev.filter((p) => p.id !== oldRow.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch as never);
    };
  }, [householdId]);

  const add = useCallback(
    async (p: Omit<Purchase, "id" | "date"> & { date?: string }) => {
      if (!householdId) return;
      const row = {
        household_id: householdId,
        amount: p.amount,
        description: p.description,
        category: p.category,
        user_name: p.user ?? null,
        date: p.date ?? new Date().toISOString(),
      };
      const { data, error } = await supabase.from("purchases").insert(row).select("*").single();
      if (error) {
        console.error(error);
        return;
      }
      const np = toPurchase(data as DbPurchase);
      setPurchases((prev) =>
        prev.some((x) => x.id === np.id) ? prev : [np, ...prev],
      );
    },
    [householdId],
  );

  const remove = useCallback(async (id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    await supabase.from("purchases").delete().eq("id", id);
  }, []);

  const update = useCallback(async (id: string, patch: Partial<Purchase>) => {
    setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const dbPatch: Record<string, string | number | null> = {};
    if (patch.amount !== undefined) dbPatch.amount = patch.amount;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.user !== undefined) dbPatch.user_name = patch.user ?? null;
    if (patch.date !== undefined) dbPatch.date = patch.date;
    await (supabase.from("purchases") as unknown as { update: (p: typeof dbPatch) => { eq: (k: string, v: string) => Promise<unknown> } }).update(dbPatch).eq("id", id);
  }, []);

  return { purchases, add, remove, update, ready };
}

/* ----------------------------- settings ----------------------------- */

interface DbHousehold {
  id: string;
  monthly: number;
  weekday: number;
  weekend: number;
  other: number;
  payday: number;
  user1: string;
  user2: string;
}

function deviceUserKey(householdId: string) {
  return `budget.currentUser.${householdId}`;
}

export function useSettings(householdId: string | null) {
  const [settings, setSettingsState] = useState<BudgetSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!householdId) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("households")
        .select("*")
        .eq("id", householdId)
        .single();
      if (!active || error || !data) {
        if (error) console.error(error);
        return;
      }
      const row = data as DbHousehold;
      const stickyUser =
        (typeof window !== "undefined" &&
          window.localStorage.getItem(deviceUserKey(householdId))) ||
        row.user1;
      setSettingsState({
        monthly: row.monthly,
        weekday: row.weekday,
        weekend: row.weekend,
        other: row.other,
        payday: row.payday,
        users: [row.user1, row.user2],
        currentUser: stickyUser,
      });
      setReady(true);
    })();

    const ch = (supabase
      .channel(`household-${householdId}`) as unknown as { on: (...args: unknown[]) => { subscribe: () => unknown } })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "households", filter: `id=eq.${householdId}` },
        (payload: { new: DbHousehold }) => {
          const row = payload.new as DbHousehold;
          setSettingsState((prev) => ({
            ...prev,
            monthly: row.monthly,
            weekday: row.weekday,
            weekend: row.weekend,
            other: row.other,
            payday: row.payday,
            users: [row.user1, row.user2],
          }));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch as never);
    };
  }, [householdId]);

  const setSettings = useCallback(
    (next: BudgetSettings | ((prev: BudgetSettings) => BudgetSettings)) => {
      setSettingsState((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        if (householdId && typeof window !== "undefined") {
          window.localStorage.setItem(deviceUserKey(householdId), value.currentUser);
        }
        if (householdId) {
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => {
            void supabase
              .from("households")
              .update({
                monthly: value.monthly,
                weekday: value.weekday,
                weekend: value.weekend,
                other: value.other,
                payday: value.payday,
                user1: value.users[0],
                user2: value.users[1],
                updated_at: new Date().toISOString(),
              })
              .eq("id", householdId)
              .then(({ error }: { error: unknown }) => {
                if (error) console.error("Save settings", error);
              });
          }, 400);
        }
        return value;
      });
    },
    [householdId],
  );

  return { settings, setSettings, ready };
}

/* ------------------------------- theme ------------------------------- */

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
