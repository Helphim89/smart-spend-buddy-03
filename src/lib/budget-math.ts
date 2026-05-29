import type { Purchase, BudgetSettings, Category } from "./budget-types";

/* --------------------------- datum-helpers --------------------------- */

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function startOfWeek(d = new Date()): Date {
  const date = startOfDay(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}
export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  // Helg = fredag (5), lördag (6), söndag (0)
  return day === 0 || day === 5 || day === 6;
}

/* --------------------------- löne-cykel --------------------------- */

/** Returnerar [start, end] (inkl) för cykeln som innehåller ref. Cykeln startar dag `payday` varje månad. */
export function cycleRange(ref: Date, payday: number): [Date, Date] {
  const pay = Math.min(Math.max(1, Math.round(payday)), 28);
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const d = ref.getDate();
  let start: Date;
  if (d >= pay) {
    start = new Date(y, m, pay);
  } else {
    start = new Date(y, m - 1, pay);
  }
  const end = endOfDay(addDays(new Date(start.getFullYear(), start.getMonth() + 1, start.getDate()), -1));
  return [startOfDay(start), end];
}

export function inRange(purchases: Purchase[], [s, e]: [Date, Date]): Purchase[] {
  const a = s.getTime();
  const b = e.getTime();
  return purchases.filter((p) => {
    const t = new Date(p.date).getTime();
    return t >= a && t <= b;
  });
}
export function sum(purchases: Purchase[]): number {
  return purchases.reduce((acc, p) => acc + p.amount, 0);
}

/* --------------------------- intersection helpers --------------------------- */

/** Skär två datumintervall. Returnerar null om ingen överlapp. */
function intersect(a: [Date, Date], b: [Date, Date]): [Date, Date] | null {
  const s = a[0].getTime() > b[0].getTime() ? a[0] : b[0];
  const e = a[1].getTime() < b[1].getTime() ? a[1] : b[1];
  if (s.getTime() > e.getTime()) return null;
  return [s, e];
}

/** Antal vardagar (mån–fre) inom intervallet, inklusive ändar. */
function countWeekdays(s: Date, e: Date): number {
  let n = 0;
  let cur = startOfDay(s);
  const end = startOfDay(e);
  while (cur.getTime() <= end.getTime()) {
    if (!isWeekend(cur)) n++;
    cur = addDays(cur, 1);
  }
  return n;
}
function countWeekendDays(s: Date, e: Date): number {
  let n = 0;
  let cur = startOfDay(s);
  const end = startOfDay(e);
  while (cur.getTime() <= end.getTime()) {
    if (isWeekend(cur)) n++;
    cur = addDays(cur, 1);
  }
  return n;
}

/* --------------------------- veckor inom cykel --------------------------- */

export interface WeekBucket {
  label: string;
  start: Date;       // effektiv start (klippt mot cykel)
  end: Date;         // effektivt slut (klippt mot cykel)
  weekdayDays: number;   // antal mån–fre inom cykeln
  weekendDays: number;   // antal lör–sön inom cykeln
  weekdayBudget: number; // pro-rata
  weekendBudget: number; // pro-rata
  mat: number;       // spenderat Mat mån–fre
  helg: number;      // spenderat Mat lör–sön
  ovrigt: number;    // spenderat Övrigt
  isCurrent: boolean;
}

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function weeksInCycle(
  purchases: Purchase[],
  settings: BudgetSettings,
  ref = new Date(),
): WeekBucket[] {
  const [cStart, cEnd] = cycleRange(ref, settings.payday);
  const todayWeekStart = startOfWeek(ref).getTime();
  const buckets: WeekBucket[] = [];
  let cursor = startOfWeek(cStart);
  while (cursor.getTime() <= cEnd.getTime()) {
    const wStart = cursor;
    const wEnd = endOfDay(addDays(cursor, 6));
    const clipped = intersect([wStart, wEnd], [cStart, cEnd]);
    if (clipped) {
      const [eStart, eEnd] = clipped;
      const wd = countWeekdays(eStart, eEnd);
      const we = countWeekendDays(eStart, eEnd);
      const weekdayBudget = Math.round((settings.weekday * wd) / 4);
      const weekendBudget = Math.round((settings.weekend * we) / 3);
      const week = inRange(purchases, [eStart, eEnd]);
      let mat = 0, helg = 0, ovrigt = 0;
      for (const p of week) {
        const d = new Date(p.date);
        if (p.category === "Mat") {
          if (isWeekend(d)) helg += p.amount;
          else mat += p.amount;
        } else {
          ovrigt += p.amount;
        }
      }
      buckets.push({
        label: `v.${isoWeek(eStart)}`,
        start: eStart,
        end: eEnd,
        weekdayDays: wd,
        weekendDays: we,
        weekdayBudget,
        weekendBudget,
        mat, helg, ovrigt,
        isCurrent: wStart.getTime() === todayWeekStart,
      });
    }
    cursor = addDays(cursor, 7);
  }
  return buckets;
}

/* --------------------------- snapshot --------------------------- */

export interface BudgetSnapshot {
  monthly: number;
  spentMonth: number;
  leftMonth: number;
  weekdayBudget: number;     // pro-rata för denna veckas vardagar inom cykel
  weekendBudget: number;     // pro-rata för denna helgs dagar inom cykel
  otherBudget: number;
  spentWeekday: number;
  spentWeekend: number;
  spentOther: number;
  leftWeekday: number;
  leftWeekend: number;
  leftOther: number;
  daysPassed: number;
  daysTotal: number;
  daysLeft: number;
  dailyAvg: number;
  forecastLeft: number;
  percentVsExpected: number;
  monthStart: Date;  // cykelns början
  monthEnd: Date;    // cykelns slut
  weekdayDays: number;
  weekendDays: number;
}

export function computeSnapshot(
  purchases: Purchase[],
  settings: BudgetSettings,
  ref = new Date(),
): BudgetSnapshot {
  const [cStart, cEnd] = cycleRange(ref, settings.payday);
  const inCycle = inRange(purchases, [cStart, cEnd]);
  const spentMonth = sum(inCycle);
  const monthly = settings.monthly;
  const leftMonth = monthly - spentMonth;

  // Denna vecka klippt mot cykel
  const wkStart = startOfWeek(ref);
  const wkEnd = endOfDay(addDays(wkStart, 6));
  const weekClip = intersect([wkStart, wkEnd], [cStart, cEnd]);

  let weekdayDays = 0, weekendDays = 0;
  let weekdayBudget = 0, weekendBudget = 0;
  let spentWeekday = 0, spentWeekend = 0;

  if (weekClip) {
    const [ws, we] = weekClip;
    weekdayDays = countWeekdays(ws, we);
    weekendDays = countWeekendDays(ws, we);
    weekdayBudget = Math.round((settings.weekday * weekdayDays) / 4);
    weekendBudget = Math.round((settings.weekend * weekendDays) / 3);

    const weekPurchases = inRange(purchases, [ws, we]);
    for (const p of weekPurchases) {
      if (p.category !== "Mat") continue;
      const d = new Date(p.date);
      if (isWeekend(d)) spentWeekend += p.amount;
      else spentWeekday += p.amount;
    }
  }

  const spentOther = sum(inCycle.filter((p) => p.category === "Övrigt"));

  const daysTotal = Math.round((cEnd.getTime() - cStart.getTime()) / 86_400_000) + 1;
  const daysPassed = Math.min(
    daysTotal,
    Math.max(1, Math.round((startOfDay(ref).getTime() - cStart.getTime()) / 86_400_000) + 1),
  );
  const daysLeft = Math.max(daysTotal - daysPassed, 0);
  const dailyAvg = daysPassed > 0 ? spentMonth / daysPassed : 0;

  // Prognos: räkna återstående pro-rata vecko/helg-budget + återstående övrigt
  const weeks = weeksInCycle(purchases, settings, ref);
  let plannedRemaining = 0;
  for (const w of weeks) {
    if (w.end.getTime() < startOfDay(ref).getTime()) continue;
    if (w.isCurrent) {
      plannedRemaining += Math.max(0, w.weekdayBudget - spentWeekday);
      plannedRemaining += Math.max(0, w.weekendBudget - spentWeekend);
    } else {
      plannedRemaining += w.weekdayBudget + w.weekendBudget;
    }
  }
  plannedRemaining += Math.max(0, settings.other - spentOther);
  const forecastLeft = monthly - spentMonth - plannedRemaining;

  const expectedSoFar = (monthly / daysTotal) * daysPassed;
  const percentVsExpected =
    expectedSoFar > 0 ? ((spentMonth - expectedSoFar) / expectedSoFar) * 100 : 0;

  return {
    monthly,
    spentMonth,
    leftMonth,
    weekdayBudget,
    weekendBudget,
    otherBudget: settings.other,
    spentWeekday,
    spentWeekend,
    spentOther,
    leftWeekday: weekdayBudget - spentWeekday,
    leftWeekend: weekendBudget - spentWeekend,
    leftOther: settings.other - spentOther,
    daysPassed,
    daysTotal,
    daysLeft,
    dailyAvg,
    forecastLeft,
    percentVsExpected,
    monthStart: cStart,
    monthEnd: cEnd,
    weekdayDays,
    weekendDays,
  };
}

export type Status = "good" | "warn" | "danger";
export function statusFromPct(pct: number): Status {
  if (pct < 70) return "good";
  if (pct < 90) return "warn";
  return "danger";
}

export function formatSEK(n: number): string {
  const rounded = Math.round(n);
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(rounded);
}

export function spentByCategory(purchases: Purchase[]): Record<Category, number> {
  const out = { Mat: 0, "Övrigt": 0 } as Record<Category, number>;
  for (const p of purchases) out[p.category] += p.amount;
  return out;
}
export function spentByUser(purchases: Purchase[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of purchases) {
    const u = p.user || "Okänd";
    out[u] = (out[u] ?? 0) + p.amount;
  }
  return out;
}

// Bakåtkompat för OutcomeTable
export function monthPurchases(purchases: Purchase[], ref = new Date(), payday = 27): Purchase[] {
  const [s, e] = cycleRange(ref, payday);
  return inRange(purchases, [s, e]);
}
// Alias
export const weeksInMonth = weeksInCycle;
