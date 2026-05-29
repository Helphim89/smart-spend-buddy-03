import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Moon, Sun, TrendingDown, TrendingUp, Utensils, Sunset, Package, CalendarDays, Share2, Check } from "lucide-react";
import { usePurchases, useSettings, useTheme, useHouseholdId } from "@/lib/budget-store";
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
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const householdId = useHouseholdId();
  const { purchases, add, remove } = usePurchases(householdId);
  const { settings, setSettings, ready } = useSettings(householdId);
  const { theme, toggle } = useTheme();
  const [copied, setCopied] = useState(false);
  const snap = computeSnapshot(purchases, settings);

  async function shareLink() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Budget", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Länk kopierad");
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      /* avbruten */
    }
  }

  const monthStatus = statusFromPct(
    snap.monthly > 0 ? (snap.spentMonth / snap.monthly) * 100 : 0,
  );
  const weekdayStatus = statusFromPct(
    snap.weekdayBudget > 0 ? (snap.spentWeekday / snap.weekdayBudget) * 100 : 0,
  );
  const weekendStatus = statusFromPct(
    snap.weekendBudget > 0 ? (snap.spentWeekend / snap.weekendBudget) * 100 : 0,
  );
  const otherStatus = statusFromPct(
    snap.otherBudget > 0 ? (snap.spentOther / snap.otherBudget) * 100 : 0,
  );

  const under = snap.percentVsExpected < 0;
  const pctAbs = Math.abs(Math.round(snap.percentVsExpected));

  const monthPct = snap.monthly > 0 ? Math.min((snap.spentMonth / snap.monthly) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (monthPct / 100) * circumference;

  const fmtRange = (a: Date, b: Date) =>
    `${a.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })} – ${b.toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}`;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-xl mx-auto flex items-center justify-between px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {fmtRange(snap.monthStart, snap.monthEnd)}
            </p>
            <h1 className="text-xl font-semibold tracking-tight">Budget</h1>
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
            <button
              onClick={shareLink}
              className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
              aria-label="Dela länk"
            >
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            </button>
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

      <main className="max-w-xl mx-auto px-5 py-6 space-y-5">
        {/* --- Summary card with ring --- */}
        <section className="bg-card rounded-2xl p-6 border border-border/60 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="shrink-0 relative">
              <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                <circle
                  cx="48" cy="48" r="42"
                  fill="none"
                  stroke="var(--color-muted)"
                  strokeWidth="6"
                />
                <circle
                  cx="48" cy="48" r="42"
                  fill="none"
                  stroke={
                    monthStatus === "good" ? "var(--color-success)"
                    : monthStatus === "warn" ? "var(--color-warning)"
                    : "var(--color-danger)"
                  }
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-[stroke-dashoffset] duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold tabular-nums">{Math.round(monthPct)}%</span>
                <span className="text-[10px] text-muted-foreground">använt</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Kvar denna månad
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
                {formatSEK(snap.leftMonth)}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-sm">
                {under ? (
                  <TrendingDown className="h-4 w-4 text-[var(--color-success)]" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-[var(--color-danger)]" />
                )}
                <span className="text-muted-foreground">
                  <span
                    className={
                      under
                        ? "text-[var(--color-success)] font-semibold"
                        : "text-[var(--color-danger)] font-semibold"
                    }
                  >
                    {pctAbs}% {under ? "under" : "över"}
                  </span>{" "}
                  budget
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Prognos kvar:{" "}
                <span className={snap.forecastLeft < 0 ? "text-[var(--color-danger)] font-semibold" : "font-medium"}>
                  {formatSEK(snap.forecastLeft)}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <MiniStat label="Dagar kvar" value={String(snap.daysLeft)} />
            <MiniStat label="Daglig snitt" value={formatSEK(snap.dailyAvg)} />
            <MiniStat label="Total budget" value={formatSEK(snap.monthly)} />
          </div>
        </section>

        {/* --- Budget blocks --- */}
        <section>
          <h2 className="px-1 pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Budget per kategori
          </h2>
          <div className="grid gap-3">
            <BudgetBlock
              title="Mat vardag"
              subtitle="mån–tors denna vecka"
              icon={Utensils}
              budget={snap.weekdayBudget}
              spent={snap.spentWeekday}
              left={snap.leftWeekday}
              status={weekdayStatus}
              editable
              onChangeBudget={(n) => setSettings({ ...settings, weekday: n })}
            />
            <BudgetBlock
              title="Mat helg"
              subtitle="lör–sön"
              icon={Sunset}
              budget={snap.weekendBudget}
              spent={snap.spentWeekend}
              left={snap.leftWeekend}
              status={weekendStatus}
              editable
              onChangeBudget={(n) => setSettings({ ...settings, weekend: n })}
            />
            <BudgetBlock
              title="Övrigt"
              subtitle="per månad"
              icon={Package}
              budget={snap.otherBudget}
              spent={snap.spentOther}
              left={snap.leftOther}
              status={otherStatus}
              editable
              onChangeBudget={(n) => setSettings({ ...settings, other: n })}
            />
            <BudgetBlock
              title="Totalt"
              subtitle="hela månaden"
              icon={CalendarDays}
              budget={snap.monthly}
              spent={snap.spentMonth}
              left={snap.leftMonth}
              status={monthStatus}
              hint={`${snap.daysLeft} dagar kvar`}
            />
          </div>
        </section>

        <WeeklyOutcome purchases={purchases} settings={settings} />

        <SpendingChart purchases={purchases} />

        <OutcomeTable
          purchases={purchases}
          users={settings.users}
        />

        <section>
          <h2 className="px-1 pb-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
