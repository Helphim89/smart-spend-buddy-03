import { cn } from "@/lib/utils";
import { formatSEK, type Status } from "@/lib/budget-math";

interface Props {
  title: string;
  budget: number;
  spent: number;
  left: number;
  status: Status;
  hint?: string;
}

const STATUS_RING: Record<Status, string> = {
  good: "bg-[var(--color-success)]",
  warn: "bg-[var(--color-warning)]",
  danger: "bg-[var(--color-danger)]",
};

const STATUS_TEXT: Record<Status, string> = {
  good: "text-[var(--color-success)]",
  warn: "text-[var(--color-warning)]",
  danger: "text-[var(--color-danger)]",
};

export function BudgetBlock({ title, budget, spent, left, status, hint }: Props) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  return (
    <div className="bg-card rounded-3xl p-5 border border-border/60">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatSEK(left)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            kvar av {formatSEK(budget)}
          </p>
        </div>
        <div className={cn("text-right", STATUS_TEXT[status])}>
          <p className="text-2xl font-semibold tabular-nums">
            {Math.round(pct)}%
          </p>
          <p className="text-xs">använt</p>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", STATUS_RING[status])}
          style={{ width: `${pct}%` }}
        />
      </div>

      {hint ? (
        <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
