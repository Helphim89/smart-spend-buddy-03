import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSEK, type Status } from "@/lib/budget-math";

interface Props {
  title: string;
  budget: number;
  spent: number;
  left: number;
  status: Status;
  hint?: string;
  editable?: boolean;
  onChangeBudget?: (n: number) => void;
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

export function BudgetBlock({
  title, budget, spent, left, status, hint, editable, onChangeBudget,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(budget));
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  function save() {
    const n = parseFloat(value.replace(",", "."));
    if (Number.isFinite(n) && n >= 0 && onChangeBudget) onChangeBudget(Math.round(n));
    setEditing(false);
  }

  return (
    <div className="bg-card rounded-3xl p-5 border border-border/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            {editable && !editing && (
              <button
                onClick={() => { setValue(String(budget)); setEditing(true); }}
                className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
                aria-label="Redigera budget"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatSEK(left)}
          </p>
          {editing ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                className="text-xs bg-muted rounded-lg px-2 py-1 w-24 outline-none focus:ring-2 focus:ring-accent tabular-nums"
              />
              <button onClick={save} className="h-7 w-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditing(false)} className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              kvar av {formatSEK(budget)}
            </p>
          )}
        </div>
        <div className={cn("text-right shrink-0", STATUS_TEXT[status])}>
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

      {hint ? <p className="mt-3 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
