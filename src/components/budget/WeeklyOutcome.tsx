import type { Purchase, BudgetSettings } from "@/lib/budget-types";
import { formatSEK, weeksInCycle } from "@/lib/budget-math";
import { cn } from "@/lib/utils";

interface Props {
  purchases: Purchase[];
  settings: BudgetSettings;
}

export function WeeklyOutcome({ purchases, settings }: Props) {
  const weeks = weeksInCycle(purchases, settings);

  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-2">
        <h3 className="font-semibold text-sm">Utfall per vecka</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Mat vardag (mån–tors), Mat helg (fre–sön), Övrigt
        </p>
      </div>

      <div className="px-5 pb-2 grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span></span>
        <span className="text-right">Vardag</span>
        <span className="text-right">Helg</span>
        <span className="text-right">Övrigt</span>
      </div>

      <div className="divide-y divide-border/40">
        {weeks.map((w, i) => (
          <div
            key={i}
            className={cn(
              "px-5 py-3 grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] gap-2 items-center text-sm transition-colors",
              w.isCurrent && "bg-accent/5"
            )}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs">{w.label}</span>
                {w.isCurrent && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold">
                    nu
                  </span>
                )}
              </div>
              <span className="text-[9px] text-muted-foreground tabular-nums">
                {w.weekdayDays}v / {w.weekendDays}h
              </span>
            </div>
            <Cell value={w.mat} budget={w.weekdayBudget} />
            <Cell value={w.helg} budget={w.weekendBudget} />
            <Cell value={w.ovrigt} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ value, budget }: { value: number; budget?: number }) {
  const over = budget !== undefined && value > budget;
  return (
    <div className="text-right">
      <p
        className={cn(
          "tabular-nums text-xs font-semibold",
          over ? "text-[var(--color-danger)]" : ""
        )}
      >
        {formatSEK(value)}
      </p>
      {budget !== undefined && (
        <p className="text-[9px] text-muted-foreground tabular-nums">
          / {formatSEK(budget)}
        </p>
      )}
    </div>
  );
}
