import type { Purchase, BudgetSettings, Category } from "./budget-types";

/* --------------------------- datum-helpers --------------------------- */

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** Måndag 00:00 i ISO-veckan som innehåller d */
export function startOfWeek(d = new Date()): Date {
  const date = startOfDay(d);
  const day = date.getDay(); // 0=sön
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

/** Mån 00:00 .. Fre 23:59 i aktuell vecka */
export function currentWeekdayRange(d = new Date()): [Date, Date] {
  const mon = startOfWeek(d);
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  return [mon, endOfDay(fri)];
}

/** Lör 00:00 .. Sön 23:59 i aktuell helg */
export function currentWeekendRange(d = new Date()): [Date, Date] {
  const mon = startOfWeek(d);
  const sat = new Date(mon);
  sat.setDate(mon.getDate() + 5);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return [startOfDay(sat), endOfDay(sun)];
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/* --------------------------- månad --------------------------- */

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function endOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
export function daysInMonth(d = new Date()): number {
  return endOfMonth(d).getDate();
}

export function monthPurchases(purchases: Purchase[], ref = new Date()): Purchase[] {
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  return inRange(purchases, [start, end]);
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

/* ---------------------- veckor inom månaden ---------------------- */

export interface WeekBucket {
  label: string;       // "v.34" eller "v.34 (denna)"
  start: Date;
  end: Date;
  mat: number;         // Mat mån–fre
  helg: number;        // Mat lör–sön
  ovrigt: number;      // allt övrigt
  isCurrent: boolean;
}

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function weeksInMonth(
  purchases: Purchase[],
  ref = new Date(),
): WeekBucket[] {
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  const buckets: WeekBucket[] = [];
  const currentWeekStart = startOfWeek(ref).getTime();
  let cursor = startOfWeek(start);
  while (cursor.getTime() <= end.getTime()) {
    const wStart = new Date(cursor);
    const wEnd = new Date(cursor);
    wEnd.setDate(wEnd.getDate() + 6);
    wEnd.setHours(23, 59, 59, 999);
    const effStart = wStart.getTime() < start.getTime() ? start : wStart;
    const effEnd = wEnd.getTime() > end.getTime() ? end : wEnd;
    const week = inRange(purchases, [effStart, effEnd]);
    let mat = 0, helg = 0, ovrigt = 0;
    for (const p of week) {
      const d = new Date(p.date);
      const wknd = isWeekend(d);
      if (p.category === "Mat") {
        if (wknd) helg += p.amount;
        else mat += p.amount;
      } else {
        ovrigt += p.amount;
      }
    }
    buckets.push({
      label: `v.${isoWeek(wStart)}`,
      start: wStart,
      end: wEnd,
      mat, helg, ovrigt,
      isCurrent: wStart.getTime() === currentWeekStart,
    });
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);
  }
  return buckets;
}

/* --------------------------- snapshot --------------------------- */

export interface BudgetSnapshot {
  monthly: number;
  spentMonth: number;
  leftMonth: number;
  weekdayBudget: number;
  weekendBudget: number;
  otherBudget: number;
  spentWeekday: number; // Mat mån–fre denna vecka
  spentWeekend: number; // Mat lör–sön denna helg
  spentOther: number;   // Övrigt under hela månaden
  leftWeekday: number;
  leftWeekend: number;
  leftOther: number;
  daysPassed: number;
  daysTotal: number;
  daysLeft: number;
  dailyAvg: number;
  forecastLeft: number;
  percentVsExpected: number;
  monthStart: Date;
  monthEnd: Date;
}

export function computeSnapshot(
  purchases: Purchase[],
  settings: BudgetSettings,
  ref = new Date(),
): BudgetSnapshot {
  const mStart = startOfMonth(ref);
  const mEnd = endOfMonth(ref);
  const inMonth = inRange(purchases, [mStart, mEnd]);
  const spentMonth = sum(inMonth);
  const monthly = settings.monthly;
  const leftMonth = monthly - spentMonth;

  const wkRange = currentWeekdayRange(ref);
  const wkEndRange = currentWeekendRange(ref);
  const spentWeekday = sum(
    inRange(purchases, wkRange).filter((p) => p.category === "Mat"),
  );
  const spentWeekend = sum(
    inRange(purchases, wkEndRange).filter((p) => p.category === "Mat"),
  );
  const spentOther = sum(inMonth.filter((p) => p.category === "Övrigt"));

  const daysTotal =
    Math.round((mEnd.getTime() - mStart.getTime()) / 86_400_000) + 1;
  const daysPassed = Math.min(
    daysTotal,
    Math.round((startOfDay(ref).getTime() - mStart.getTime()) / 86_400_000) + 1,
  );
  const daysLeft = Math.max(daysTotal - daysPassed, 0);
  const dailyAvg = daysPassed > 0 ? spentMonth / daysPassed : 0;

  // Prognos
  const weeks = weeksInMonth(purchases, ref);
  let plannedRemaining = 0;
  for (const w of weeks) {
    if (w.end.getTime() < startOfDay(ref).getTime()) continue;
    if (w.isCurrent) {
      plannedRemaining += Math.max(0, settings.weekday - spentWeekday);
      plannedRemaining += Math.max(0, settings.weekend - spentWeekend);
    } else if (w.start.getTime() > ref.getTime()) {
      plannedRemaining += settings.weekday + settings.weekend;
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
    weekdayBudget: settings.weekday,
    weekendBudget: settings.weekend,
    otherBudget: settings.other,
    spentWeekday,
    spentWeekend,
    spentOther,
    leftWeekday: settings.weekday - spentWeekday,
    leftWeekend: settings.weekend - spentWeekend,
    leftOther: settings.other - spentOther,
    daysPassed,
    daysTotal,
    daysLeft,
    dailyAvg,
    forecastLeft,
    percentVsExpected,
    monthStart: mStart,
    monthEnd: mEnd,
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
