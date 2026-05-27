import type { Purchase } from "@/lib/budget-types";
import { CATEGORIES } from "@/lib/budget-types";
import { formatSEK, spentByCategory, spentByUser, monthPurchases } from "@/lib/budget-math";

interface Props {
  purchases: Purchase[];
  users: [string, string];
}

export function OutcomeTable({ purchases, users }: Props) {
  const inMonth = monthPurchases(purchases);
  const totals = spentByCategory(inMonth);
  const grand = Object.values(totals).reduce((a, b) => a + b, 0);
  const perUser = spentByUser(inMonth);

  return (
    <div className="bg-card rounded-3xl border border-border/60 overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-baseline justify-between">
        <h3 className="font-semibold">Utfall denna månad</h3>
        <p className="text-sm text-muted-foreground tabular-nums">{formatSEK(grand)}</p>
      </div>

      <div className="divide-y divide-border/60">
        {CATEGORIES.map((c) => {
          const value = totals[c];
          const pct = grand > 0 ? (value / grand) * 100 : 0;
          return (
            <div key={c} className="px-5 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{c}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatSEK(value)}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-border/60 grid grid-cols-2 gap-3">
        {users.map((u) => (
          <div key={u} className="rounded-2xl bg-muted/60 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground truncate">
              {u}
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums">
              {formatSEK(perUser[u] ?? 0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
