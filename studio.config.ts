// One file says what this build is and which AI modes it offers. The kit reads it everywhere.
import type { StudioConfig } from "@/kit/ai/types";

const config: StudioConfig = {
  app: {
    name: "Peel",
    slug: "peel",
    version: "0.1.0",
    tagline: "Scan any grocery barcode and see how healthy it really is",
    repo: "https://github.com/VedSoni-dev/peel",
    url: "https://peel.vedantsoni.com",
    alternativeTo: "Yuka",
  },
  // Pick the modes that make sense for this build (docs/auth.md). Order = order in the picker. The hosted picker hides ChatGPT plan (local runs only).
  modes: ["claude","publik","chatgpt","local"],
  defaultMode: "claude",
};

export default config;
