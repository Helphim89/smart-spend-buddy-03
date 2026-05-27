import { useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";
import { CATEGORIES, type Category } from "@/lib/budget-types";
import { categorize, parseQuickEntry } from "@/lib/categorize";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  users: [string, string];
  currentUser: string;
  onSetUser: (u: string) => void;
  onAdd: (entry: {
    amount: number;
    description: string;
    category: Category;
    user: string;
  }) => void;
}

export function AddPurchase({ onAdd, users, currentUser, onSetUser }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState<Category | null>(null);

  const parsed = parseQuickEntry(input);
  const suggested = parsed ? categorize(parsed.description) : null;
  const chosen = category ?? suggested;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed || !chosen) {
      toast.error("Skriv t.ex. 'Mat 129' eller 'Pizza 250'");
      return;
    }
    onAdd({
      amount: parsed.amount,
      description: parsed.description,
      category: chosen,
      user: currentUser,
    });
    toast.success(`${parsed.description} • ${chosen} • ${currentUser}`);
    setInput("");
    setCategory(null);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/25 flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Lägg till köp"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-6 pb-8 border border-border shadow-xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Nytt köp</h2>
              <button
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
                aria-label="Stäng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit}>
              <div className="mb-3 flex gap-2">
                {users.map((u) => {
                  const active = currentUser === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => onSetUser(u)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-sm font-medium border transition-colors",
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card text-foreground border-border hover:bg-muted/50",
                      )}
                    >
                      {u}
                    </button>
                  );
                })}
              </div>

              <input
                autoFocus
                inputMode="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Mat 129"
                className="w-full text-lg font-medium bg-muted rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground/60"
              />

              {parsed && suggested && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span>
                    Föreslagen kategori:{" "}
                    <span className="text-foreground font-medium">{suggested}</span>
                  </span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const active = chosen === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card text-foreground border-border hover:bg-muted/50",
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={!parsed}
                className="mt-5 w-full bg-accent text-accent-foreground rounded-xl py-3.5 font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                Lägg till
              </button>

              <p className="mt-3 text-xs text-muted-foreground text-center">
                Tips: Vin & sprit räknas som Mat. Allt utan matkoppling blir Övrigt.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
