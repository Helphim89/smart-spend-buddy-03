import type { Category } from "./budget-types";

// Allt som luktar mat, dryck eller livsmedel räknas som Mat.
// Vin, sprit, öl, systembolaget = Mat.
const MAT_KEYWORDS = [
  "mat", "ica", "coop", "willys", "lidl", "hemköp", "hemkop", "city gross",
  "matkasse", "frukost", "lunch", "middag", "fika",
  "mjölk", "mjolk", "bröd", "brod", "frukt", "grönt", "gront", "kött", "kott",
  "kyckling", "fisk", "tacos", "pasta", "ris", "pizza", "läsk", "lask",
  "godis", "snacks", "kaffe", "te ", "smör", "smor", "ost", "ägg", "agg",
  "yoghurt", "müsli", "musli",
  // dryck / alkohol -> mat
  "vin", "öl", "ol", "bira", "sprit", "whisky", "vodka", "gin", "rom",
  "champagne", "cider", "alkohol", "systembolaget", "systemet", "bolaget",
  // snabbmat & restaurang räknas också som mat
  "restaurang", "sushi", "burger", "mcdonalds", "max ", "kfc", "subway",
  "thai", "kebab", "café", "cafe", "espresso house", "wayne", "starbucks",
  "bar ", "pub",
];

export function categorize(input: string): Category {
  const text = " " + input.toLowerCase() + " ";
  for (const kw of MAT_KEYWORDS) {
    if (text.includes(kw)) return "Mat";
  }
  return "Övrigt";
}

/** Parse "Mat 129" or "Köpte tacos och läsk 230" -> { description, amount } */
export function parseQuickEntry(
  input: string,
): { description: string; amount: number } | null {
  const match = input.match(/^(.*?)([\d]+(?:[.,]\d{1,2})?)\s*(kr|sek)?\s*$/i);
  if (!match) return null;
  const description = match[1].trim().replace(/[-:,]\s*$/, "").trim();
  const amount = parseFloat(match[2].replace(",", "."));
  if (!description || !Number.isFinite(amount) || amount <= 0) return null;
  return { description, amount };
}
