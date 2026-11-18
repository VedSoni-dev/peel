// GET /api/swaps?code=<barcode> → healthier products from the same shelf, scored.
import { cleanCode, getProduct, getSwaps } from "@/lib/off";
import { scoreProduct } from "@/lib/score";
import { SAMPLES } from "@/lib/samples";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const code = cleanCode(new URL(req.url).searchParams.get("code") ?? "");
  if (!code) return Response.json({ error: "Missing barcode." }, { status: 400 });
  try {
    const product = SAMPLES.find((s) => s.code === code) ?? (await getProduct(code));
    if (!product) return Response.json({ swaps: [] });
    const swaps = await getSwaps(product, scoreProduct(product).score);
    return Response.json({ swaps }, { headers: { "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch {
    return Response.json({ error: "Couldn't load swaps right now. Try again in a minute." }, { status: 502 });
  }
}
