import type { Purchase, BudgetSettings } from "./budget-types";

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

export function monthPurchases(purchases: Purchase[], ref = new Date()): Purchase[] {
  const s = startOfMonth(ref).getTime();
  const e = endOfMonth(ref).getTime();
  return purchases.filter((p) => {
    const t = new Date(p.date).getTime();
    return t >= s && t <= e;
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
  spentWeekday: number;
  spentWeekend: number;
  leftWeekday: number;
  leftWeekend: number;
  daysPassed: number;
  daysTotal: number;
  daysLeft: number;
  dailyAvg: number;
  forecast: number;
  dailyLeft: number;
  percentVsExpected: number; // negative = under budget
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

  const weekdayBudget = monthly * settings.weekdayShare;
  const weekendBudget = monthly - weekdayBudget;

  const spentWeekday = sum(inMonth.filter((p) => !isWeekend(new Date(p.date))));
  const spentWeekend = sum(inMonth.filter((p) => isWeekend(new Date(p.date))));

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
    weekdayBudget,
    weekendBudget,
    spentWeekday,
    spentWeekend,
    leftWeekday: weekdayBudget - spentWeekday,
    leftWeekend: weekendBudget - spentWeekend,
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
