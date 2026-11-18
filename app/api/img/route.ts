// GET /api/img?u=<Open Food Facts image URL> → the same image, cached for a week at the edge. OFF's image server can
// take seconds per photo; through here a product's photo is slow once, then instant for everyone. Only OFF's own
// image host is allowed, so this is never an open proxy.
export const runtime = "nodejs";

const HOST = "https://images.openfoodfacts.org/";

export async function GET(req: Request) {
  const u = new URL(req.url).searchParams.get("u") ?? "";
  if (!u.startsWith(HOST) || !/\.(jpe?g|png|webp)$/i.test(new URL(u).pathname)) return new Response("Not an Open Food Facts image.", { status: 400 });
  const res = await fetch(u, { headers: { "User-Agent": "Peel/0.1 (open source; https://github.com/VedSoni-dev/peel)" }, next: { revalidate: 60 * 60 * 24 * 7 } }).catch(() => null);
  if (!res?.ok || !res.body) return new Response("Image unavailable.", { status: 502 });
  return new Response(res.body, { headers: { "content-type": res.headers.get("content-type") ?? "image/jpeg", "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" } });
}
