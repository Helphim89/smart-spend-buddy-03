import type { Purchase, BudgetSettings, Category } from "./budget-types";

export function isWeekend(d: Date): boolean {
  const day = d.getDay(); // 0 Sun, 5 Fri, 6 Sat
  return day === 0 || day === 5 || day === 6;
}

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function endOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
export function daysInMonth(d = new Date()): number {
  return endOfMonth(d).getDate();
}

/** Monday 00:00 of the ISO week containing d */
export function startOfWeek(d = new Date()): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0..6, Sun..Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  date.setDate(date.getDate() + diff);
  return date;
}

/** Mon 00:00 .. Thu 23:59 of current week */
export function currentWeekdayRange(d = new Date()): [Date, Date] {
  const mon = startOfWeek(d);
  const thuEnd = new Date(mon);
  thuEnd.setDate(mon.getDate() + 3);
  thuEnd.setHours(23, 59, 59, 999);
  return [mon, thuEnd];
}

/** Fri 00:00 .. Sun 23:59 of current weekend (the weekend after current week's Mon) */
export function currentWeekendRange(d = new Date()): [Date, Date] {
  const mon = startOfWeek(d);
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return [fri, sun];
}

export function monthPurchases(purchases: Purchase[], ref = new Date()): Purchase[] {
  const s = startOfMonth(ref).getTime();
  const e = endOfMonth(ref).getTime();
  return purchases.filter((p) => {
    const t = new Date(p.date).getTime();
    return t >= s && t <= e;
  });
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

export interface BudgetSnapshot {
  monthly: number;
  spentMonth: number;
  leftMonth: number;
  weekdayBudget: number;
  weekendBudget: number;
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
  forecast: number;
  dailyLeft: number;
  percentVsExpected: number;
}

export function computeSnapshot(
  purchases: Purchase[],
  settings: BudgetSettings,
  ref = new Date(),
): BudgetSnapshot {
  const inMonth = monthPurchases(purchases, ref);
  const spentMonth = sum(inMonth);
  const monthly = settings.monthly;
  const leftMonth = monthly - spentMonth;

  const spentWeekday = sum(inRange(purchases, currentWeekdayRange(ref)));
  const spentWeekend = sum(inRange(purchases, currentWeekendRange(ref)));
  const spentOther = sum(inMonth.filter((p) => p.category === "Övrigt"));

  const daysTotal = daysInMonth(ref);
  const daysPassed = ref.getDate();
  const daysLeft = Math.max(daysTotal - daysPassed, 0);
  const dailyAvg = daysPassed > 0 ? spentMonth / daysPassed : 0;
  const forecast = dailyAvg * daysTotal;
  const dailyLeft = daysLeft > 0 ? leftMonth / daysLeft : leftMonth;

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
    forecast,
    dailyLeft,
    percentVsExpected,
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
  const out = {
    Mat: 0, Restaurang: 0, Barn: 0, Hus: 0, Nöje: 0, Transport: 0, Övrigt: 0,
  } as Record<Category, number>;
  for (const p of purchases) out[p.category] += p.amount;
  return out;
}
