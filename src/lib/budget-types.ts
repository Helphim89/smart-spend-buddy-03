export const CATEGORIES = ["Mat", "Övrigt"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Purchase {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: string; // ISO
  user?: string;
}

export interface BudgetSettings {
  monthly: number;
  weekday: number;  // Mat mån–tors per full vecka (4 dagar)
  weekend: number;  // Mat fre–sön per full helg (3 dagar)
  other: number;    // Övrigt per cykel
  payday: number;   // 1..28 — lönedag (cykelstart). Flyttas vid helg.
  users: [string, string];
  currentUser: string;
}
