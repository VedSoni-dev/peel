# Peel: design

Made with the taste skill (tasteskill 2.5.1), 2026-11-17. The score is the product: one number, one colour, then why.

- **Theme:** paper (`kit/ui/themes/paper.css`), re-toned to the dealt palette below in `app/globals.css`: a white sheet, ink, one biro blue. Paper's small type scale and quiet shadows stay.
- **One-line feel:** a clean label you can read in a grocery aisle in one second.
- **Type:** Reddit Sans (display 500, tracking -3%), JetBrains Mono for E-numbers and barcodes.
- **Colour:** background #ffffff, surface #f4f4f4, ink #111111, ONE accent #1a4be0 (the primary action and the live state only). The score owns four colours of its own: excellent #0b7a3e, good #5aa832, poor #e07a12, bad #d23a2a, used only for rings and dots; the words next to them stay ink.
- **The hero moment:** the real result on screen: Doritos Nacho Cheese at 18/100, Bad, its colours listed, and a swap card finding Late July tortilla chips at 80.
- **Motion:** follows docs/principles.md. Signature motion: the score ring draws once (640 ms, ease-out) when a product opens: the rare moment. The scan line sweeps while the camera is live (a loop, so like a spinner). Frequent things (rows, additives opening) are instant.
- **Every state designed:** empty: the scanner, sample products and your scans · loading: skeleton cards, a spinner in Peel's take · error: camera blocked / no camera / not in Open Food Facts (with "Add it to Open Food Facts") / OFF busy, each with a shake and the fix · success: the ring draws, the phone buzzes once on a read.
- **Reel shots:** 1) a "healthy-looking" snack scanned, the ring drawing to red 2) a tapped additive explaining itself 3) a swap scoring green next to "$15/yr vs free".

## The deal (taste skill, never by taste)

- **Kind:** software. Category: grocery barcode scanner with health scores. Main action: **Scan a product**.
- **Hero:** `collage`: words on five columns; Peel's product window on the lit sky ground, cut by the frame's right and bottom; the small swap card over its lower left (its loop: layout.js steps).
- **Palette:** `white-link-blue`, the second dealt. The first, `oxblood-grey`, puts a deep red on everything, and red means "Bad" in the score; a neutral biro blue keeps the score's colours meaning one thing.
- **Pairing:** `reddit`. **Radius** round (a consumer app). **Buttons** tonal. **Mark** initial (a P on the blue).
- **Nav** `nav-mega` (two link columns and the granola card), **close** `close-type`, **footer** `footer-columns`, **rhythm** `surface-pairs` (the additives section on the surface ground), **lit ground** sky.
- **Effect:** none. **Moment:** `iris-opens` on `#additives` (the grey ground opens through a disc as it scrolls in).

## The landing, screen by screen (1440x900)

| Screen | Section | What it shows |
|---|---|---|
| 1 | hero | h1 "Free grocery barcode scanner with health scores"; Scan a product, Get the code; "Yuka Premium costs $15 a year. Peel is free, with no account." |
| 2 | `#scans` | the app-frame: six scans with their rings beside Bob's Red Mill granola, 62, Good, its parts and nutrition |
| 3 | `#additives` | 180 additives rated; Coca-Cola's two with E150d open; nitrite, titanium dioxide, aspartame, lecithins |
| 4 | `#score` | three cards: Nutrition 60 (Nutri-Score grades), Additives 30 (Doritos' sum), Organic 10 (rolled oats, 94) |
| 5 | `#questions` | four questions; the six sample products |
| 6 | footer | Scan a product; links; Open Food Facts credit; "Inspired by Yuka. Not affiliated with it." |

Every product, score and additive on the page is computed from `lib/samples.json` by the app's own code, at request time.

## 2026-11-20: no AI, Sign in with publik

Vedant: "get rid of ai, just make them use publik to sign in to use it". Peel's take, the AI route and the mode picker
are gone. `/app` sits behind `components/Gate.tsx` (the kit's `usePublikGate({ usesAi: false })`): a sign-in screen
in Peel's look, with the six sample products and their real scores beside it. The landing lost its `#take` section.
