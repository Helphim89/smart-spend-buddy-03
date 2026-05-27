import { useState } from "react";
import { type LucideIcon, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSEK, type Status } from "@/lib/budget-math";

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  budget: number;
  spent: number;
  left: number;
  status: Status;
  hint?: string;
  editable?: boolean;
  onChangeBudget?: (n: number) => void;
}

const STATUS_BG: Record<Status, string> = {
  good: "bg-[var(--color-success)]/10",
  warn: "bg-[var(--color-warning)]/10",
  danger: "bg-[var(--color-danger)]/10",
};
const STATUS_BAR: Record<Status, string> = {
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
  title, subtitle, icon: Icon, budget, spent, left, status, hint, editable, onChangeBudget,
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
    <div className={cn("bg-card rounded-2xl p-5 border border-border/60 shadow-sm", STATUS_BG[status])}>
      <div className="flex items-center gap-4">
        {/* Icon */}
        {Icon && (
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
            STATUS_BAR[status].replace("bg-", "bg-").replace("[var(", "[").replace(")]", "]"),
            "bg-muted"
          )}>
            <Icon className="h-5 w-5 text-foreground/70" />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{title}</p>
            {subtitle && (
              <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
            )}
            {editable && !editing && (
              <button
                onClick={() => { setValue(String(budget)); setEditing(true); }}
                className="h-6 w-6 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground shrink-0"
                aria-label="Redigera budget"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>

          {editing ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                className="text-sm bg-muted rounded-lg px-2 py-1 w-24 outline-none focus:ring-2 focus:ring-accent tabular-nums"
              />
              <button onClick={save} className="h-7 w-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditing(false)} className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-xl font-bold tabular-nums">{formatSEK(left)}</p>
              <p className="text-xs text-muted-foreground">kvar av {formatSEK(budget)}</p>
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-300", STATUS_BAR[status])}
              style={{ width: `${pct}%` }}
            />
          </div>

          {hint && <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>}
        </div>

        {/* Percentage */}
        {!editing && (
          <div className={cn("text-right shrink-0", STATUS_TEXT[status])}>
            <p className="text-xl font-bold tabular-nums">{Math.round(pct)}%</p>
            <p className="text-[10px] text-muted-foreground">använt</p>
          </div>
        )}
      </div>
    </div>
  );
}
