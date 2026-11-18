// Open Food Facts: the free, open database of food products (ODbL). Server only: every call names Peel in its
// User-Agent, as OFF asks of apps, and is cached so one popular barcode isn't fetched again and again.
import type { Product } from "./score";
import { scoreProduct, type Scored } from "./score";

const UA = "Peel/0.1 (open source; https://github.com/VedSoni-dev/peel)";
const FIELDS = "code,product_name,product_name_en,generic_name,brands,quantity,image_front_url,image_front_small_url,nutriscore_grade,nutriscore_score,nutriments,additives_tags,labels_tags,categories_tags,ingredients_text_en,ingredients_text,nova_group,countries_tags";

type Raw = Record<string, unknown> & { code?: string };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v !== "" && Number.isFinite(+v) ? +v : null);
const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** OFF's photos go through /api/img, which caches them (its image server can be slow). */
const viaProxy = (u: string) => (u ? (u.startsWith("https://images.openfoodfacts.org/") ? `/api/img?u=${encodeURIComponent(u)}` : u) : null);

export function toProduct(r: Raw): Product {
  const n = (r.nutriments ?? {}) as Record<string, unknown>;
  const nutriments: Record<string, number | undefined> = {};
  for (const [k, v] of Object.entries(n)) { const x = num(v); if (x !== null && k.endsWith("_100g")) nutriments[k] = x; }
  const grade = str(r.nutriscore_grade).toLowerCase();
  return {
    code: str(r.code),
    name: str(r.product_name_en) || str(r.product_name) || str(r.generic_name) || "Unnamed product",
    brand: (Array.isArray(r.brands) ? str(r.brands[0]) : str(r.brands).split(",")[0] ?? "").trim(),
    quantity: str(r.quantity),
    image: viaProxy(str(r.image_front_url) || str(r.image_front_small_url)),
    nutriscore: { grade: /^[a-e]$/.test(grade) ? grade : null, score: num(r.nutriscore_score) },
    nutriments,
    additiveTags: arr(r.additives_tags),
    labels: arr(r.labels_tags),
    categories: arr(r.categories_tags),
    ingredients: str(r.ingredients_text_en) || str(r.ingredients_text),
    nova: num(r.nova_group),
    countries: arr(r.countries_tags),
  };
}

/** Postel: "0 16000-27528 7" and "16000275287" both find the same box (UPC-A is EAN-13 with a leading zero). */
export function cleanCode(input: string): string | null {
  const d = input.replace(/\D/g, "");
  if (d.length < 6 || d.length > 14) return null;
  return d.length === 12 ? `0${d}` : d;
}

export async function getProduct(code: string): Promise<Product | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`, {
    headers: { "User-Agent": UA }, next: { revalidate: 60 * 60 * 24 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts answered ${res.status}`);
  const data = (await res.json()) as { status?: number; product?: Raw };
  if (data.status !== 1 || !data.product) return null;
  return toProduct({ ...data.product, code: data.product.code || code });
}

export type Swap = { product: Product; scored: Scored };

/** Healthier products from the same shelf: the product's most specific category, graded A or B, most scanned first. */
export async function getSwaps(p: Product, mine: number | null): Promise<Swap[]> {
  const market = new Set(p.countries?.length ? p.countries : ["en:united-states"]);
  const cats = p.categories.filter((c) => c.startsWith("en:")).slice(-3).reverse();
  for (const cat of cats) {
    const q = `categories_tags:"${cat}" AND nutrition_grades:(a OR b)`;
    const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&fields=${FIELDS},completeness&page_size=60&sort_by=-unique_scans_n`;
    const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: 60 * 60 * 24 } }).catch(() => null);
    if (!res?.ok) continue;
    const data = (await res.json().catch(() => null)) as { hits?: Raw[] } | null;
    const seen = new Set<string>([p.code]);
    const out: (Swap & { here: boolean })[] = [];
    for (const h of data?.hits ?? []) {
      if (typeof h.completeness === "number" && h.completeness < 0.5) continue; // thin listings make poor advice
      const product = toProduct(h);
      const key = product.name.toLowerCase().replace(/\s+/g, " ");
      if (!product.code || seen.has(product.code) || seen.has(key) || !product.image || product.name === "Unnamed product") continue;
      seen.add(product.code); seen.add(key);
      const scored = scoreProduct(product);
      if (scored.score === null || (mine !== null && scored.score <= mine)) continue;
      out.push({ product, scored, here: arr(h.countries_tags).some((c) => market.has(c)) });
    }
    // Products sold where the scanned one is sold come first (most Peel users shop in the US), then by score.
    out.sort((a, b) => Number(b.here) - Number(a.here) || (b.scored.score ?? 0) - (a.scored.score ?? 0));
    if (out.length >= 2) return out.slice(0, 6).map(({ product, scored }) => ({ product, scored }));
  }
  return [];
}
