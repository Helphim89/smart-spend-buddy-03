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
  weekday: number;  // Mat mån–fre per full vecka
  weekend: number;  // Mat lör–sön per full helg
  other: number;    // Övrigt per cykel
  payday: number;   // 1..28
  users: [string, string];
  currentUser: string;
}
