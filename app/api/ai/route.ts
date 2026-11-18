// "Peel's take": a short, plain read of one scanned product, or an answer to the person's question about it.
// Whatever mode the person picked (Claude key, publik, ChatGPT plan, local model), streamText() routes it there.
import { streamText } from "@/kit/ai";
import { scoreProduct, BAND_LABEL, type Product } from "@/lib/score";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM = `You are Peel, a grocery scanner that helps people eat better. You get one product's real data (from Open Food
Facts) and Peel's 0-100 score for it. Talk like a friend who knows nutrition: plain words, no lecturing, no medical
claims, no diagnosis. Never invent numbers or ingredients that are not in the data. If the data is thin, say so.
Default answer (no question): 3 short lines, each starting with a bold lead-in: **Verdict:** one sentence on whether it
is an everyday food, a sometimes food or a rare treat, and why. **Watch:** the one or two things that matter most (a
nutrient or additive, with its number). **Instead:** what to look for on the shelf instead (a kind of product, not a
brand). If the person asks a question, answer it in at most 4 short sentences using the same data.`;

function brief(p: Product) {
  const s = scoreProduct(p);
  const n = s.nutrients.map((x) => `${x.label} ${+x.value.toFixed(1)}${x.unit} per 100${s.drink ? "ml" : "g"} (${x.good ? "good" : x.level})`).join("; ");
  const adds = s.additives.map((a) => `${a.code}${a.name ? ` ${a.name}` : ""}: ${a.unrated ? "not rated" : `${a.risk} risk`}`).join("; ") || "none listed";
  return [
    `Product: ${p.name}${p.brand ? ` by ${p.brand}` : ""}${p.quantity ? ` (${p.quantity})` : ""}`,
    `Peel score: ${s.score === null ? "not enough nutrition data" : `${s.score}/100 (${BAND_LABEL[s.band!]})`}; nutrition ${s.parts.nutrition ?? "?"}/60, additives ${s.parts.additives}/30, organic ${s.parts.organic}/10${s.capped ? "; capped at 49 by a high-risk additive" : ""}`,
    `Nutri-Score: ${p.nutriscore.grade?.toUpperCase() ?? "unknown"}. NOVA processing group: ${p.nova ?? "unknown"}.`,
    `Nutrients: ${n || "unknown"}`,
    `Additives: ${adds}`,
    `Ingredients: ${p.ingredients.slice(0, 900) || "not listed"}`,
  ].join("\n");
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { product?: Product; question?: string };
  const p = body.product;
  if (!p || typeof p.name !== "string" || !Array.isArray(p.additiveTags)) return Response.json({ error: "Scan a product first." }, { status: 400 });
  const q = typeof body.question === "string" ? body.question.trim().slice(0, 400) : "";
  const content = `${brief(p)}\n\n${q ? `Question: ${q}` : "Give Peel's take."}`;
  return streamText(req, { system: SYSTEM, messages: [{ role: "user", content }], tier: "fast" });
}
