import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // publik's public app token is read at run time from the repo root; ship it with the server routes.
  outputFileTracingIncludes: { "/api/**": ["./publik-app-token.txt", "./publik-pending.txt", "./kit/publik-app-token.txt"] },
  poweredByHeader: false,
  // No Next.js dev badge: it would show up in tools/capture.mjs screenshots and videos.
  devIndicators: false,
  // AGENTS.md is ours; don't let next dev rewrite it.
  agentRules: false,
  // apps/peel is its own repo inside the studio: build from here, not the studio's lockfile.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
