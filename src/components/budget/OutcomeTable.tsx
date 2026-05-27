import type { Purchase } from "@/lib/budget-types";
import { CATEGORIES } from "@/lib/budget-types";
import { formatSEK, spentByCategory, spentByUser, monthPurchases } from "@/lib/budget-math";
import { Utensils, Package } from "lucide-react";

interface Props {
  purchases: Purchase[];
  users: [string, string];
}

const CATEGORY_ICON = {
  Mat: Utensils,
  "Övrigt": Package,
} as const;

const CATEGORY_ACCENT = {
  Mat: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "Övrigt": "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
} as const;

export function OutcomeTable({ purchases, users }: Props) {
  const inMonth = monthPurchases(purchases);
  const totals = spentByCategory(inMonth);
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);
  const perUser = spentByUser(inMonth);

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Utfall denna månad</h3>
        <span className="text-xs font-semibold tabular-nums bg-muted px-2.5 py-1 rounded-full">
          {formatSEK(grand)}
        </span>
      </div>

      <div className="px-5 pb-4 grid grid-cols-2 gap-3">
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICON[c];
          const value = totals[c];
          const pct = grand > 0 ? (value / grand) * 100 : 0;
          return (
            <div key={c} className="rounded-xl border border-border/40 p-3">
              <div className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${CATEGORY_ACCENT[c]}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium">{c}</span>
              </div>
              <p className="mt-2 text-lg font-bold tabular-nums">{formatSEK(value)}</p>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-border/40 grid grid-cols-2 gap-3">
        {users.map((u) => (
          <div key={u} className="rounded-xl bg-muted/50 px-3.5 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
              {u}
            </p>
            <p className="mt-0.5 text-sm font-bold tabular-nums">
              {formatSEK(perUser[u] ?? 0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
