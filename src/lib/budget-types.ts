export const CATEGORIES = ["Mat", "Övrigt"] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Purchase {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: string; // ISO
  user?: string; // namn på personen som la in
}

export interface BudgetSettings {
  monthly: number;  // per löningscykel
  weekday: number;  // mån–fre Mat-budget per vecka
  weekend: number;  // lör–sön Mat-budget per helg
  other: number;    // Övrigt-budget per löningscykel
  payday: number;   // dag i månaden som lönen kommer (default 27)
  users: [string, string];
  currentUser: string;
}
