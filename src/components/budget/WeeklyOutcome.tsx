import type { Purchase } from "@/lib/budget-types";
import { formatSEK, weeksInMonth } from "@/lib/budget-math";

interface Props {
  purchases: Purchase[];
  weekdayBudget: number;
  weekendBudget: number;
  otherBudget: number;
}

export function WeeklyOutcome({
  purchases, weekdayBudget, weekendBudget,
}: Props) {
  const weeks = weeksInMonth(purchases);

  return (
    <div className="bg-card rounded-3xl border border-border/60 overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="font-semibold">Utfall per vecka</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Mat mån–fre, Mat helg, samt övrigt — per vecka denna månad
        </p>
      </div>
      <div className="px-5 pb-3 grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span></span>
        <span className="text-right">Vecka</span>
        <span className="text-right">Helg</span>
        <span className="text-right">Övrigt</span>
      </div>
      <div className="divide-y divide-border/60">
        {weeks.map((w, i) => (
          <div
            key={i}
            className="px-5 py-3 grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] gap-2 items-center text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{w.label}</span>
              {w.isCurrent && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                  nu
                </span>
              )}
            </div>
            <Cell value={w.mat} budget={weekdayBudget} />
            <Cell value={w.helg} budget={weekendBudget} />
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
        className={`tabular-nums font-medium ${
          over ? "text-[var(--color-danger)]" : ""
        }`}
      >
        {formatSEK(value)}
      </p>
      {budget !== undefined && (
        <p className="text-[10px] text-muted-foreground tabular-nums">
          av {formatSEK(budget)}
        </p>
      )}
    </div>
  );
}
