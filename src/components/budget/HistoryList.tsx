import { Trash2 } from "lucide-react";
import type { Purchase } from "@/lib/budget-types";
import { formatSEK } from "@/lib/budget-math";

interface Props {
  purchases: Purchase[];
  onRemove: (id: string) => void;
}

const CATEGORY_COLOR: Record<string, string> = {
  Mat: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Restaurang: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  Barn: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  Hus: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Nöje: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  Transport: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Övrigt: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export function HistoryList({ purchases, onRemove }: Props) {
  if (purchases.length === 0) {
    return (
      <div className="bg-card rounded-3xl p-8 border border-border/60 text-center text-sm text-muted-foreground">
        Inga köp ännu. Tryck på + för att lägga till.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl border border-border/60 overflow-hidden divide-y divide-border/60">
      {purchases.slice(0, 20).map((p) => (
        <div key={p.id} className="flex items-center gap-3 px-5 py-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate capitalize">{p.description}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  CATEGORY_COLOR[p.category] ?? CATEGORY_COLOR.Övrigt
                }`}
              >
                {p.category}
              </span>
              <span>{formatDate(p.date)}</span>
            </div>
          </div>
          <p className="font-semibold tabular-nums">{formatSEK(p.amount)}</p>
          <button
            onClick={() => onRemove(p.id)}
            className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Ta bort"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
