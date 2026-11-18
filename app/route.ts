// "/" is the landing page: static HTML built from the app's own data (lib/landing.ts explains why it is not React).
import { landingHTML } from "@/lib/landing";

export const dynamic = "force-static";

export function GET() {
  return new Response(landingHTML(), { headers: { "content-type": "text/html; charset=utf-8" } });
}
