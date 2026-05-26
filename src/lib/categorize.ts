import type { Category } from "./budget-types";

const KEYWORDS: Record<Category, string[]> = {
  Mat: [
    "mat", "ica", "coop", "willys", "lidl", "hemköp", "city gross",
    "mjölk", "bröd", "frukt", "grönt", "kött", "kyckling", "fisk",
    "tacos", "pasta", "ris", "pizza ingred", "läsk", "godis", "snacks",
    "frukost", "lunchlåda", "matkasse",
  ],
  Restaurang: [
    "restaurang", "pizza", "sushi", "burger", "mcdonalds", "max",
    "kfc", "subway", "thai", "kebab", "café", "cafe", "fika",
    "espresso house", "wayne", "starbucks", "lunch ute", "middag ute",
    "ölhak", "bar", "öl ute",
  ],
  Barn: [
    "barn", "blöjor", "barnvagn", "leksak", "leksaker", "lego",
    "förskola", "dagis", "skola", "lekland", "babyshop",
  ],
  Hus: [
    "hus", "hem", "hyra", "el", "vatten", "bredband", "wifi",
    "möbel", "ikea", "jysk", "verktyg", "bauhaus", "byggmax",
    "städ", "tvätt", "rengöring", "växt", "blomma",
  ],
  Nöje: [
    "nöje", "bio", "netflix", "spotify", "viaplay", "hbo", "disney",
    "spel", "playstation", "steam", "konsert", "biljett", "gym",
    "padel", "bok", "tidning",
  ],
  Transport: [
    "transport", "bensin", "diesel", "tanka", "tankning", "okq8",
    "circle k", "shell", "preem", "sl", "buss", "tåg", "sj",
    "taxi", "uber", "bolt", "parkering", "p-avgift", "trängselskatt",
  ],
  Övrigt: [],
};

export function categorize(input: string): Category {
  const text = input.toLowerCase();
  let best: { cat: Category; score: number } = { cat: "Övrigt", score: 0 };
  for (const cat of Object.keys(KEYWORDS) as Category[]) {
    for (const kw of KEYWORDS[cat]) {
      if (text.includes(kw)) {
        const score = kw.length;
        if (score > best.score) best = { cat, score };
      }
    }
  }
  return best.cat;
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
