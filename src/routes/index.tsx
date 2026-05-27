import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun, TrendingDown, TrendingUp } from "lucide-react";
import { usePurchases, useSettings, useTheme } from "@/lib/budget-store";
import {
  computeSnapshot,
  formatSEK,
  statusFromPct,
} from "@/lib/budget-math";
import { BudgetBlock } from "@/components/budget/BudgetBlock";
import { AddPurchase } from "@/components/budget/AddPurchase";
import { HistoryList } from "@/components/budget/HistoryList";
import { SpendingChart } from "@/components/budget/SpendingChart";
import { OutcomeTable } from "@/components/budget/OutcomeTable";
import { WeeklyOutcome } from "@/components/budget/WeeklyOutcome";
import { SettingsSheet } from "@/components/budget/SettingsSheet";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { purchases, add, remove } = usePurchases();
  const { settings, setSettings } = useSettings();
  const { theme, toggle } = useTheme();
  const snap = computeSnapshot(purchases, settings);

  const monthStatus = statusFromPct(
    snap.monthly > 0 ? (snap.spentMonth / snap.monthly) * 100 : 0,
  );
  const weekdayStatus = statusFromPct(
    snap.weekdayBudget > 0 ? (snap.spentWeekday / snap.weekdayBudget) * 100 : 0,
  );
  const weekendStatus = statusFromPct(
    snap.weekendBudget > 0 ? (snap.spentWeekend / snap.weekendBudget) * 100 : 0,
  );

  const under = snap.percentVsExpected < 0;
  const pctAbs = Math.abs(Math.round(snap.percentVsExpected));

  const fmtRange = (a: Date, b: Date) =>
    `${a.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}–${b.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}`;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-xl mx-auto flex items-center justify-between px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {fmtRange(snap.monthStart, snap.monthEnd)}
            </p>
            <h1 className="text-xl font-semibold">Budget</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-full p-1 text-xs font-medium">
              {settings.users.map((u) => {
                const active = settings.currentUser === u;
                return (
                  <button
                    key={u}
                    onClick={() => setSettings({ ...settings, currentUser: u })}
                    className={`px-3 py-1.5 rounded-full transition-colors max-w-[6rem] truncate ${
                      active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {u}
                  </button>
                );
              })}
            </div>
            <SettingsSheet settings={settings} onChange={setSettings} />
            <button
              onClick={toggle}
              className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
              aria-label="Byt tema"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6 space-y-4">
        <section className="bg-card rounded-3xl p-5 border border-border/60">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total budget / månad
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {formatSEK(settings.monthly)}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/60 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Kvar
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatSEK(snap.leftMonth)}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/60 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Prognos kvar
              </p>
              <p
                className={`mt-1 text-lg font-semibold tabular-nums ${
                  snap.forecastLeft < 0 ? "text-[var(--color-danger)]" : ""
                }`}
              >
                {formatSEK(snap.forecastLeft)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                om hela budgeten används
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            {under ? (
              <TrendingDown className="h-4 w-4 text-[var(--color-success)]" />
            ) : (
              <TrendingUp className="h-4 w-4 text-[var(--color-danger)]" />
            )}
            <span className="text-muted-foreground">
              Du ligger{" "}
              <span
                className={
                  under
                    ? "text-[var(--color-success)] font-medium"
                    : "text-[var(--color-danger)] font-medium"
                }
              >
                {pctAbs}% {under ? "under" : "över"} budget
              </span>
            </span>
          </div>
        </section>

        <div className="grid gap-3">
          <BudgetBlock
            title="Mat mån–fre (denna vecka)"
            budget={snap.weekdayBudget}
            spent={snap.spentWeekday}
            left={snap.leftWeekday}
            status={weekdayStatus}
            editable
            onChangeBudget={(n) => setSettings({ ...settings, weekday: n })}
          />
          <BudgetBlock
            title="Mat helg (lör–sön)"
            budget={snap.weekendBudget}
            spent={snap.spentWeekend}
            left={snap.leftWeekend}
            status={weekendStatus}
            editable
            onChangeBudget={(n) => setSettings({ ...settings, weekend: n })}
          />
          <BudgetBlock
            title="Övrigt (per månad)"
            budget={snap.otherBudget}
            spent={snap.spentOther}
            left={snap.leftOther}
            status={statusFromPct(
              snap.otherBudget > 0 ? (snap.spentOther / snap.otherBudget) * 100 : 0,
            )}
            editable
            onChangeBudget={(n) => setSettings({ ...settings, other: n })}
            hint="Allt som inte är mat hamnar här"
          />
          <BudgetBlock
            title="Hela månaden"
            budget={snap.monthly}
            spent={snap.spentMonth}
            left={snap.leftMonth}
            status={monthStatus}
            hint={`${snap.daysLeft} dagar kvar • ${formatSEK(snap.dailyAvg)}/dag i snitt`}
          />
        </div>

        <WeeklyOutcome
          purchases={purchases}
          weekdayBudget={settings.weekday}
          weekendBudget={settings.weekend}
          otherBudget={settings.other}
        />

        <SpendingChart purchases={purchases} />

        <OutcomeTable
          purchases={purchases}
          users={settings.users}
        />

        <section>
          <h2 className="px-2 pb-2 pt-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Senaste köpen
          </h2>
          <HistoryList purchases={purchases} onRemove={remove} />
        </section>
      </main>

      <AddPurchase
        onAdd={add}
        users={settings.users}
        currentUser={settings.currentUser}
        onSetUser={(u) => setSettings({ ...settings, currentUser: u })}
      />
      <Toaster position="top-center" />
    </div>
  );
}
