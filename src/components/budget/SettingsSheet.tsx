import { useState } from "react";
import { Settings as Cog, X } from "lucide-react";
import type { BudgetSettings } from "@/lib/budget-types";

interface Props {
  settings: BudgetSettings;
  onChange: (s: BudgetSettings) => void;
}

export function SettingsSheet({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(settings);

  function save() {
    onChange(local);
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => { setLocal(settings); setOpen(true); }}
        className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
        aria-label="Inställningar"
      >
        <Cog className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 pb-8 border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Inställningar</h2>
              <button
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
                aria-label="Stäng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Total budget per månad (kr)">
                <input
                  type="number"
                  value={local.monthly}
                  onChange={(e) => setLocal({ ...local, monthly: +e.target.value || 0 })}
                  className="w-32 bg-muted rounded-xl px-3 py-2 tabular-nums outline-none focus:ring-2 focus:ring-accent"
                />
              </Field>

              <Field label="Mat mån–fre per vecka (kr)">
                <input
                  type="number"
                  value={local.weekday}
                  onChange={(e) => setLocal({ ...local, weekday: +e.target.value || 0 })}
                  className="w-32 bg-muted rounded-xl px-3 py-2 tabular-nums outline-none focus:ring-2 focus:ring-accent"
                />
              </Field>

              <Field label="Mat helg per helg (kr)">
                <input
                  type="number"
                  value={local.weekend}
                  onChange={(e) => setLocal({ ...local, weekend: +e.target.value || 0 })}
                  className="w-32 bg-muted rounded-xl px-3 py-2 tabular-nums outline-none focus:ring-2 focus:ring-accent"
                />
              </Field>

              <Field label="Övrigt per månad (kr)">
                <input
                  type="number"
                  value={local.other}
                  onChange={(e) => setLocal({ ...local, other: +e.target.value || 0 })}
                  className="w-32 bg-muted rounded-xl px-3 py-2 tabular-nums outline-none focus:ring-2 focus:ring-accent"
                />
              </Field>

              <div className="pt-2 border-t border-border/60">
                <p className="text-sm font-medium mb-2">Personer</p>
                <div className="space-y-2">
                  {[0, 1].map((i) => (
                    <input
                      key={i}
                      type="text"
                      value={local.users[i]}
                      onChange={(e) => {
                        const users = [...local.users] as [string, string];
                        users[i] = e.target.value;
                        const currentUser =
                          settings.currentUser === local.users[i]
                            ? e.target.value
                            : local.currentUser;
                        setLocal({ ...local, users, currentUser });
                      }}
                      placeholder={`Person ${i + 1}`}
                      className="w-full bg-muted rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={save}
              className="mt-6 w-full bg-accent text-accent-foreground rounded-2xl py-4 font-semibold active:scale-[0.98] transition-transform"
            >
              Spara
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-muted-foreground flex-1">{label}</label>
      {children}
    </div>
  );
}
