import { Trash2 } from "lucide-react";
import type { Purchase } from "@/lib/budget-types";
import { formatSEK } from "@/lib/budget-math";

interface Props {
  purchases: Purchase[];
  onRemove: (id: string) => void;
}

const CATEGORY_STYLE: Record<string, string> = {
  Mat: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  "Övrigt": "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export function HistoryList({ purchases, onRemove }: Props) {
  if (purchases.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-10 border border-border/60 text-center">
        <p className="text-sm text-muted-foreground">Inga köp ännu</p>
        <p className="text-xs text-muted-foreground mt-1">Tryck på + for att lägga till</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/40">
      {purchases.slice(0, 30).map((p) => (
        <div key={p.id} className="flex items-center gap-3 px-4 py-3 group">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate capitalize">{p.description}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                  CATEGORY_STYLE[p.category] ?? CATEGORY_STYLE["Övrigt"]
                }`}
              >
                {p.category}
              </span>
              {p.user && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground">
                  {p.user}
                </span>
              )}
              <span>{formatDate(p.date)}</span>
            </div>
          </div>
          <p className="text-sm font-bold tabular-nums shrink-0">{formatSEK(p.amount)}</p>
          <button
            onClick={() => onRemove(p.id)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
            aria-label="Ta bort"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
