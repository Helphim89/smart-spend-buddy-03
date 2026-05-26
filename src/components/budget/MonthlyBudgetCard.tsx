import { useState } from "react";
import { Pencil, Check } from "lucide-react";
import { formatSEK } from "@/lib/budget-math";

interface Props {
  monthly: number;
  onChange: (n: number) => void;
}

export function MonthlyBudgetCard({ monthly, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(monthly));

  function save() {
    const n = parseFloat(value.replace(",", "."));
    if (Number.isFinite(n) && n > 0) onChange(Math.round(n));
    setEditing(false);
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Månadsbudget
        </p>
        {editing ? (
          <div className="mt-1 flex items-center gap-2">
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="text-3xl font-semibold tabular-nums bg-muted rounded-xl px-3 py-1 w-40 outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={save}
              className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center"
            >
              <Check className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {formatSEK(monthly)}
          </p>
        )}
      </div>
      {!editing && (
        <button
          onClick={() => {
            setValue(String(monthly));
            setEditing(true);
          }}
          className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"
          aria-label="Redigera budget"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
