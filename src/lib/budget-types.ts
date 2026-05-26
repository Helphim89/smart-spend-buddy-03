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
  weekdayShare: number; // 0..1 share of monthly budget assigned to mon-thu
}
