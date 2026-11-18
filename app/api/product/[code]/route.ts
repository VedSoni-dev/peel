// GET /api/product/<barcode> → the product from Open Food Facts and Peel's score for it.
import { cleanCode, getProduct } from "@/lib/off";
import { scoreProduct } from "@/lib/score";
import { SAMPLES } from "@/lib/samples";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const code = cleanCode(decodeURIComponent((await ctx.params).code));
  if (!code) return Response.json({ error: "That isn't a barcode. It's the 8 to 13 digits under the stripes." }, { status: 400 });
  const sample = SAMPLES.find((s) => s.code === code);
  try {
    const product = sample ?? (await getProduct(code));
    if (!product) return Response.json({ error: "Not in Open Food Facts yet.", code }, { status: 404 });
    return Response.json({ product, scored: scoreProduct(product), sample: Boolean(sample) }, { headers: { "cache-control": "public, max-age=3600, s-maxage=86400" } });
  } catch (e) {
    const busy = e instanceof Error && /429/.test(e.message);
    return Response.json({ error: busy ? "Open Food Facts is busy. Try again in a minute." : "Couldn't reach Open Food Facts. Check your connection and try again." }, { status: busy ? 429 : 502 });
  }
}
