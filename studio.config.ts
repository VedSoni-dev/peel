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
  // No AI in Peel: publik is only the sign-in (components/Gate.tsx), so the picker never shows.
  modes: ["publik"],
  defaultMode: "publik",
};

export default config;
