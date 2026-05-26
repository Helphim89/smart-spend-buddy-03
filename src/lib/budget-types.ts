export const CATEGORIES = [
  "Mat",
  "Restaurang",
  "Barn",
  "Hus",
  "Nöje",
  "Transport",
  "Övrigt",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Purchase {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: string; // ISO
}

export interface BudgetSettings {
  monthly: number;
  weekday: number; // mon-thu budget for current week
  weekend: number; // fri-sun budget for current weekend
  other: number;   // monthly "Övrigt" budget
}
