// Peel's 0–100 score, in the open: nutrition 60 points, additives 30, organic 10. The same split Yuka publishes;
// the maths below is ours. Runs on the server and in the browser (no imports beyond the additive table).
import { uniqueAdditives, type Additive } from "./additives";

export type Band = "excellent" | "good" | "poor" | "bad";
export type Level = "low" | "moderate" | "high";

export type Product = {
  code: string;
  name: string;
  brand: string;
  quantity: string;
  image: string | null;
  nutriscore: { grade: string | null; score: number | null };
  nutriments: Record<string, number | undefined>;
  additiveTags: string[];
  labels: string[];
  categories: string[];
  ingredients: string;
  nova: number | null;
  countries?: string[];
};

export type Nutrient = { key: string; label: string; value: number; unit: string; level: Level; good: boolean };

export type Scored = {
  score: number | null;
  band: Band | null;
  parts: { nutrition: number | null; additives: number; organic: number };
  capped: boolean;
  drink: boolean;
  organic: boolean;
  additives: Additive[];
  nutrients: Nutrient[];
  reasons: string[];
};

export const BAND_LABEL: Record<Band, string> = { excellent: "Excellent", good: "Good", poor: "Poor", bad: "Bad" };

export function bandFor(score: number): Band {
  return score >= 75 ? "excellent" : score >= 50 ? "good" : score >= 25 ? "poor" : "bad";
}

// Exact categories only: "en:plant-based-foods-and-beverages" sits on cereals and crisps too, so a suffix match is wrong.
const DRINKS = new Set(["en:beverages", "en:sodas", "en:waters", "en:carbonated-drinks", "en:fruit-juices", "en:juices-and-nectars", "en:teas", "en:coffees", "en:energy-drinks"]);
const isDrink = (p: Product) => p.categories.some((c) => DRINKS.has(c));
const isOrganic = (p: Product) => p.labels.some((l) => /(^|:)(organic|eu-organic|usda-organic|bio|ab-agriculture-biologique|fr-bio-01)$/.test(l) || l.endsWith(":organic"));

/** Straight lines between known points: the Nutri-Score number → nutrition points out of 60. */
function interp(x: number, knots: [number, number][]): number {
  if (x <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    const [x1, y1] = knots[i], [x0, y0] = knots[i - 1];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return knots[knots.length - 1][1];
}
// Grade edges of the 2023 Nutri-Score: food A ≤ 0, B ≤ 2, C ≤ 10, D ≤ 18; drinks B ≤ 2, C ≤ 6, D ≤ 9.
const FOOD: [number, number][] = [[-10, 60], [0, 50], [2, 42], [10, 28], [18, 14], [30, 0]];
const DRINK: [number, number][] = [[-2, 60], [0, 50], [2, 42], [6, 28], [9, 14], [16, 0]];
const BY_GRADE: Record<string, number> = { a: 52, b: 42, c: 28, d: 14, e: 4 };

function nutritionPoints(p: Product, drink: boolean): number | null {
  const { grade, score } = p.nutriscore;
  if (typeof score === "number" && grade && /^[a-e]$/.test(grade)) return interp(score, drink ? DRINK : FOOD);
  if (grade && BY_GRADE[grade] !== undefined) return BY_GRADE[grade];
  return null;
}

// The UK's front-of-pack traffic lights (per 100 g of food, per 100 ml of drink); energy and the good ones are ours.
const LIMITS = {
  food: { "energy-kcal": [160, 360], sugars: [5, 22.5], "saturated-fat": [1.5, 5], salt: [0.3, 1.5], fat: [3, 17.5] },
  drink: { "energy-kcal": [20, 70], sugars: [2.5, 11.25], "saturated-fat": [0.75, 2.5], salt: [0.3, 0.75], fat: [1.5, 8.75] },
} as const;
const LABEL: Record<string, string> = { "energy-kcal": "Calories", sugars: "Sugar", "saturated-fat": "Saturated fat", salt: "Salt", fat: "Fat", fiber: "Fibre", proteins: "Protein" };

function nutrients(p: Product, drink: boolean): Nutrient[] {
  const n = p.nutriments, out: Nutrient[] = [];
  const lim = drink ? LIMITS.drink : LIMITS.food;
  for (const key of ["energy-kcal", "sugars", "saturated-fat", "salt"] as const) {
    const v = n[`${key}_100g`];
    if (typeof v !== "number") continue;
    const [lo, hi] = lim[key];
    const level: Level = v <= lo ? "low" : v > hi ? "high" : "moderate";
    out.push({ key, label: LABEL[key], value: v, unit: key === "energy-kcal" ? "kcal" : "g", level, good: level === "low" });
  }
  if (!drink) {
    const f = n["fiber_100g"], pr = n["proteins_100g"];
    if (typeof f === "number" && f >= 3) out.push({ key: "fiber", label: LABEL.fiber, value: f, unit: "g", level: f >= 6 ? "high" : "moderate", good: true });
    if (typeof pr === "number" && pr >= 8) out.push({ key: "proteins", label: LABEL.proteins, value: pr, unit: "g", level: pr >= 16 ? "high" : "moderate", good: true });
  }
  return out;
}

export function scoreProduct(p: Product): Scored {
  const drink = isDrink(p);
  const organic = isOrganic(p);
  const additives = uniqueAdditives(p.additiveTags);
  const nutrition = nutritionPoints(p, drink);

  let add = 30;
  const high = additives.filter((a) => a.risk === "high");
  for (const a of additives) add -= a.risk === "moderate" ? 8 : a.risk === "limited" ? 2 : 0;
  if (high.length) add = 0;
  add = Math.max(0, add);
  const org = organic ? 10 : 0;

  const list = nutrients(p, drink);
  const reasons: string[] = [];
  const bad = list.filter((x) => x.level === "high" && !x.good && x.key !== "energy-kcal"); // calories alone say little (oats are 370 kcal)
  for (const x of bad) reasons.push(`High in ${x.label.toLowerCase()}`);
  if (high.length) reasons.push(`${high.length === 1 ? "An additive" : `${high.length} additives`} rated high risk`);
  const mod = additives.filter((a) => a.risk === "moderate").length;
  if (mod) reasons.push(`${mod} additive${mod > 1 ? "s" : ""} to watch`);
  if (!additives.length && p.additiveTags.length === 0) reasons.push("No additives");
  for (const x of list.filter((x) => x.good && x.key !== "energy-kcal" && x.level !== "low")) reasons.push(`Good ${x.label.toLowerCase()}`);
  if (organic) reasons.push("Organic");

  if (nutrition === null) {
    return { score: null, band: null, parts: { nutrition: null, additives: add, organic: org }, capped: false, drink, organic, additives, nutrients: list, reasons };
  }
  let score = Math.round(nutrition + add + org);
  const capped = high.length > 0 && score > 49;
  if (capped) score = 49;
  score = Math.max(0, Math.min(100, score));
  return { score, band: bandFor(score), parts: { nutrition: Math.round(nutrition), additives: add, organic: org }, capped, drink, organic, additives, nutrients: list, reasons: reasons.slice(0, 4) };
}
