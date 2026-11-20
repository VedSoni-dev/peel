// The public landing page at "/", as one static HTML document (app/route.ts serves it). It is built on the taste
// skill's kit (public/assets: system.css, layout, motion, moments), which is plain CSS and scripts written for a static
// page, so the page is plain HTML rather than React: no hydration for the kit's scripts to trip over, and none of the
// app's Tailwind here. Every product, score and additive on it is real: the samples (lib/samples.json, saved from Open
// Food Facts), scored by lib/score.ts and explained by lib/additives.ts. DESIGN.md has the plan.
import config from "@/studio.config";
import { SAMPLES } from "@/lib/samples";
import { scoreProduct, BAND_LABEL, type Band, type Product } from "@/lib/score";
import { ADDITIVES, lookupAdditive } from "@/lib/additives";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const byCode = (c: string) => SAMPLES.find((p) => p.code === c)!;
const ARROW = `<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg>`;
const CHEV = `<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const RATED = Object.keys(ADDITIVES).length;

/** The score ring exactly as the app draws it (components/ProductView.tsx), as a still SVG. */
function ring(score: number, band: Band, size: number): string {
  const r = 44, c = 2 * Math.PI * r;
  return `<span class="pl-ring" data-band="${band}" style="width:${size}px;height:${size}px"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="${r}" fill="none" stroke="#eeeeee" stroke-width="8"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--c)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - score / 100)).toFixed(1)}" transform="rotate(-90 50 50)"/></svg><b style="font-size:${Math.round(size * 0.32)}px">${score}</b></span>`;
}
const img = (p: Product, cls = "") => `<img class="pl-shot ${cls}" src="${p.image}" alt="" width="80" height="80" loading="lazy" data-source="client" data-subject="${esc(p.name)}, a product scanned in Peel">`;
const RISK = { none: "No risk", limited: "Limited risk", moderate: "Moderate risk", high: "High risk" } as const;
const riskRow = (tag: string, open = false) => {
  const a = lookupAdditive(tag);
  return `<div class="pl-add${open ? " is-open" : ""}"><span class="pl-dot" data-risk="${a.risk}"></span><span class="pl-add__name"><code>${a.code}</code> ${esc(a.name)}</span><span class="pl-add__risk">${RISK[a.risk]}</span>${open ? `<p>${esc(a.note)}</p>` : ""}</div>`;
};

export function landingHTML(): string {
  const { app } = config;
  const doritos = byCode("0028400090896"), granola = byCode("0039978003645"), cola = byCode("5449000000996");
  const ds = scoreProduct(doritos), gs = scoreProduct(granola), cs = scoreProduct(cola);
  const title = "Peel: free grocery barcode scanner with health scores";
  const description = "Scan a food barcode and Peel scores it out of 100 for nutrition, additives and organic, explains every additive and finds healthier swaps. A free, open-source Yuka alternative.";
  const scans = ["0039978003645", "0028400090896", "5449000000996", "3017620422003", "0038000138416", "0039978013873"].map(byCode);

  return `<!doctype html>
<html lang="en" data-type="software" data-radius="round" data-ground="sky" data-buttons="tonal" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="A 0 to 100 score for any grocery barcode: nutrition, additives, organic. Free with Sign in with publik, MIT licensed.">
<meta property="og:url" content="${app.url}/">
<meta property="og:image" content="${app.url}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="628">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="A 0 to 100 score for any grocery barcode: nutrition, additives, organic. Free with Sign in with publik, MIT licensed.">
<meta name="twitter:image" content="${app.url}/og.png">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#ffffff">
<link rel="canonical" href="${app.url}/">
<meta name="site-kind" content="software">
<meta name="page-type" content="software">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Reddit+Sans:wght@400..700&family=JetBrains+Mono:wght@400..500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/system.css">
<link rel="stylesheet" href="/assets/ui/cards.css">
<link rel="stylesheet" href="/assets/motion/motion.css">
<link rel="stylesheet" href="/assets/backgrounds/backgrounds.css">
<link rel="stylesheet" href="/assets/layout/layout.css">
<link rel="stylesheet" href="/assets/icons/icon.css">
<style>
:root {
  --p-bg: #ffffff; --p-surface: #f4f4f4; --p-ink: #111111; --p-muted: #6b6b6b;
  --p-accent: #1a4be0; --p-accent-ink: #ffffff; --p-action: #1a4be0; --p-action-ink: #ffffff;
  --p-inv-bg: #111111; --p-inv-surface: #1e1e1e; --p-inv-ink: #ffffff; --p-inv-muted: #9a9a9a;
  --p-inv-accent: #ffffff; --p-inv-accent-ink: #111111; --p-inv-action: #ffffff; --p-inv-action-ink: #111111;
  --font-display: "Reddit Sans", system-ui, sans-serif;
  --font-text: "Reddit Sans", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --display-weight: 500;
  --display-tracking: -0.03em;
  --display-tracking-xl: -0.04em;
}
</style>
<link rel="stylesheet" href="/assets/ui/base.css">
<link rel="stylesheet" href="/landing.css">
<script>document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)</script>
<script src="/assets/backgrounds/backgrounds.js"></script>
<script>document.documentElement.classList.add('mo-js');setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500)</script>
<link rel="modulepreload" href="/assets/moments/moments.js">
<link rel="modulepreload" href="/assets/moments/lib.js">
<link rel="modulepreload" href="/assets/moments/iris-opens/moment.js">
</head>
<body>
<!-- type: software (site-kind software) · category: grocery barcode scanner with health scores · main action: Scan a product
     deal: hero collage, nav nav-mega, close close-type, footer footer-columns, rhythm surface-pairs, buttons tonal,
           mark initial, palette white-link-blue (taken over oxblood-grey: the score owns red and green, so the page's
           own colour stays a neutral biro blue on white paper), type reddit, radius round, lit ground sky
     effect: none (the hero's own loop is the small swap card); moments: iris-opens on #additives (from base)
     screens at 1440x900: hero 1 · scans 1 · additives 1 · score 1 · questions 1 · footer 1 -->
<header class="nav">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Skip to content</a>
    <a class="nav__logo" href="#top"><span class="pl-mark" aria-hidden="true">P</span>Peel</a>
    <nav class="nav__links" aria-label="Main">
      <div class="nav__item">
        <a class="nav__link" href="#scans">Product ${CHEV}</a>
        <div class="nav__menu">
          <div class="wrap grid">
            <div class="menu-col span-3"><p class="t-label">Scan</p><a href="#scans">Scores out of 100<span>Nutrition, additives, organic</span></a><a href="#score">How the score adds up<span>60, 30 and 10 points</span></a></div>
            <div class="menu-col span-3"><p class="t-label">Understand</p><a href="#additives">Additives explained<span>${RATED} E-numbers rated</span></a><a href="#questions">Questions<span>Data, privacy, sign-in</span></a></div>
            <a class="menu-card span-4 start-9" href="/app?code=${granola.code}">
              <div class="panel pl-menu-panel">${img(granola)}${ring(gs.score!, gs.band!, 64)}</div>
              <span class="t-card">${esc(granola.name)}</span>
              <span class="t-small muted">${esc(granola.brand)} · ${BAND_LABEL[gs.band!]}, ${gs.score} out of 100</span>
            </a>
          </div>
        </div>
      </div>
      <div class="nav__item"><a class="nav__link" href="#additives">Additives</a></div>
      <div class="nav__item"><a class="nav__link" href="#score">Score</a></div>
      <div class="nav__item"><a class="nav__link" href="#questions">Questions</a></div>
    </nav>
    <div class="nav__actions">
      <a class="nav__link" href="${app.repo}">GitHub</a>
      <a class="btn btn--primary" href="/app">Scan a product</a>
    </div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Menu"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
  </div>
</header>

<main id="top">
  <section class="hero hero--collage" data-enter aria-labelledby="hero-h">
    <div class="wrap"><div class="hero-text grid hero__grid">
      <div class="hero__text span-5">
        <h1 id="hero-h">Free grocery barcode scanner with health scores</h1>
        <p class="hero__lead">Point your phone at a barcode and Peel scores the food out of 100, names every additive and finds a better pick from the same shelf.</p>
        <div class="btn-row"><a class="btn btn--primary" href="/app">Scan a product${ARROW}</a><a class="btn btn--secondary" href="${app.repo}">Get the code</a></div>
        <p class="hero__proof">Yuka Premium costs $15 a year. Peel is free: sign in with publik and scan.</p>
      </div>
      <div class="hero__art span-6 start-7" role="img" aria-label="Peel open on Doritos Nacho Cheese: 18 out of 100, Bad, with three colours to watch; a swap card finds Late July tortilla chips at 80">
        <div class="ly-piece ly-piece--main pl-win" aria-hidden="true">
          <div class="pl-win__bar"><span class="pl-win__logo"><span class="pl-mark">P</span>Peel</span><span class="pl-win__link">Your scans</span></div>
          <div class="pl-win__body">
            <div class="pl-prod">${img(doritos, "pl-shot--lg")}<div><b>${esc(doritos.name)}</b><span>${esc(doritos.brand)} · ${esc(doritos.quantity)}</span></div></div>
            <div class="pl-verdict">${ring(ds.score!, ds.band!, 104)}<div><p class="pl-band" data-band="${ds.band}"><span class="pl-dot"></span>${BAND_LABEL[ds.band!]}</p><div class="pl-chips">${ds.reasons.map((r) => `<span>${esc(r)}</span>`).join("")}</div></div></div>
            <div class="pl-adds"><p class="pl-adds__head">Additives <span>${ds.additives.length}</span></p>${["e102", "e110", "e129", "e621", "e330"].map((t, i) => riskRow(t, i === 0)).join("")}</div>
          </div>
        </div>
        <div class="ly-piece ly-piece--note pl-note" aria-hidden="true" data-ly-steps="700">
          <div class="pl-note__head"><b>Better swap</b><span class="pl-chip" data-step data-step-at="4">+62 points</span></div>
          <div class="pl-note__row" data-step><img class="pl-shot" src="/products/0815099021634.jpg" alt="" width="44" height="44" data-source="client" data-subject="Late July tortilla chips, a product in Open Food Facts">
            <div><b>Late July Thin &amp; Crispy</b><span>Tortilla chips · same shelf</span></div>${ring(80, "excellent", 44)}</div>
          <div class="pl-note__line" data-step><span class="pl-dot" data-risk="none"></span>No additives, organic</div>
        </div>
      </div>
    </div></div>
  </section>

  <section class="section" id="scans" aria-labelledby="scans-h">
    <div class="wrap">
      <div class="grid">
        <h2 id="scans-h" class="span-5">Every scan scored out of 100</h2>
        <div class="span-6 start-7 stack-4">
          <p class="t-lead">Excellent from 75, good from 50, poor from 25. Your scans stay on your phone; nothing about them is uploaded.</p>
          <a class="link" href="/app?code=${granola.code}">Open the granola in Peel</a>
        </div>
      </div>
      <div class="ui app pl-app" role="img" aria-label="The Peel app: six scanned products with their scores beside Bob's Red Mill Honey Oat Granola, 62 out of 100, Good, with its nutrition per 100 grams">
        <div class="app__pane app__pane--list">
          <div class="pl-list" aria-hidden="true">
            <div class="pl-list__head"><b>Your scans</b><span>${scans.length}</span></div>
            ${scans.map((p, i) => { const s = scoreProduct(p); return `<div class="pl-row${i === 0 ? " is-on" : ""}">${img(p)}<div class="pl-row__text"><b>${esc(p.name)}</b><span>${esc(p.brand)}</span></div>${ring(s.score!, s.band!, 40)}</div>`; }).join("\n            ")}
          </div>
        </div>
        <div class="app__pane app__pane--open">
          <div class="pl-open" aria-hidden="true">
            <div class="pl-prod">${img(granola, "pl-shot--lg")}<div><b>${esc(granola.name)}</b><span>${esc(granola.brand)} · ${esc(granola.quantity)}</span></div></div>
            <div class="pl-verdict">${ring(gs.score!, gs.band!, 96)}<div><p class="pl-band" data-band="${gs.band}"><span class="pl-dot"></span>${BAND_LABEL[gs.band!]}</p><div class="pl-chips">${gs.reasons.map((r) => `<span>${esc(r)}</span>`).join("")}</div></div></div>
            <div class="pl-parts">${[["Nutrition", gs.parts.nutrition!, 60], ["Additives", gs.parts.additives, 30], ["Organic", gs.parts.organic, 10]].map(([l, v, m]) => `<div><span>${l}</span><b>${v}<i>/${m}</i></b><em style="--v:${(Number(v) / Number(m)) * 100}%"></em></div>`).join("")}</div>
            <div class="pl-nut"><p class="pl-adds__head">Nutrition <span>per 100 g</span></p>${gs.nutrients.map((n) => `<div class="pl-add"><span class="pl-dot" data-band="${n.good ? "excellent" : n.level === "moderate" ? "poor" : "bad"}"></span><span class="pl-add__name">${n.label}</span><span class="pl-add__risk">${+n.value.toFixed(n.value < 10 ? 1 : 0)} ${n.unit}</span></div>`).join("")}</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section ground-surface" id="additives" aria-labelledby="additives-h" data-moment="iris-opens" data-moment-opts='{"from": "base"}'>
    <div class="wrap">
      <div class="grid fill pl-split">
        <div class="span-5 stack-6">
          <h2 id="additives-h">${RATED} additives, each rated and explained</h2>
          <p class="t-lead">Tap any E-number for its risk and the reason, from the EU&apos;s warning label for six food colours to the FDA&apos;s 2025 ban on Red No. 3.</p>
          <p class="pl-legend"><span><span class="pl-dot" data-risk="none"></span>No risk</span><span><span class="pl-dot" data-risk="limited"></span>Limited</span><span><span class="pl-dot" data-risk="moderate"></span>Moderate</span><span><span class="pl-dot" data-risk="high"></span>High: caps the score at 49</span></p>
        </div>
        <div class="span-6 start-7">
          <div class="pl-card pl-addcard" role="img" aria-label="Additives in Coca-Cola: E150d caramel colour, moderate risk, with its reason open, and E338 phosphoric acid, limited risk; below, from Peel's table, sodium nitrite and titanium dioxide at high risk, aspartame at moderate risk and lecithins at no risk">
            <div aria-hidden="true">
              <div class="pl-prod pl-prod--sm">${img(cola)}<div><b>${esc(cola.name)}</b><span data-band="${cs.band}"><span class="pl-dot"></span>${BAND_LABEL[cs.band!]}, ${cs.score} out of 100</span></div></div>
              ${riskRow("e150d", true)}
              ${riskRow("e338")}
              <div class="pl-more"><p class="pl-adds__head pl-adds__head--gap">Also in Peel&apos;s table</p>
              ${riskRow("e250", true)}
              ${riskRow("e171", true)}
              ${riskRow("e951")}
              ${riskRow("e322")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="score" aria-labelledby="score-h">
    <div class="wrap">
      <div class="section-head">
        <h2 id="score-h">How the 100 points add up. <span class="muted">Yuka&apos;s published split, with Peel&apos;s maths in the open.</span></h2>
      </div>
      <div class="grid pl-parts3">
        <article class="card span-4">
          <h3>Nutrition, 60 points</h3>
          <p>From the 2023 Nutri-Score, which weighs sugar, salt and saturated fat against fibre and protein.</p>
          <div class="panel panel--inset pl-panel" role="img" aria-label="Nutri-Score grades A to E, with Doritos Nacho Cheese at D"><div class="pl-grades" aria-hidden="true">${["a", "b", "c", "d", "e"].map((g) => `<span class="${g === doritos.nutriscore.grade ? "is-on" : ""}" data-g="${g}">${g.toUpperCase()}</span>`).join("")}<p>${esc(doritos.name)}: grade ${doritos.nutriscore.grade?.toUpperCase()}, ${ds.parts.nutrition} of 60</p></div></div>
        </article>
        <article class="card span-4">
          <h3>Additives, 30 points</h3>
          <p>Each moderate additive costs 8 points and each limited one 2. One high-risk additive caps the whole score at 49.</p>
          <div class="panel panel--inset pl-panel" role="img" aria-label="Additive points for Doritos Nacho Cheese: three moderate colours and three limited flavour enhancers take 30 points to 0"><div class="pl-sum" aria-hidden="true"><p><span>3 moderate × 8</span><b>−24</b></p><p><span>3 limited × 2</span><b>−6</b></p><p class="is-total"><span>Additives</span><b>0 of 30</b></p></div></div>
        </article>
        <article class="card span-4">
          <h3>Organic, 10 points</h3>
          <p>Ten points for a USDA, EU or other official organic label on the pack. Nothing for the word alone.</p>
          <div class="panel panel--inset pl-panel" role="img" aria-label="Bob's Red Mill Old Fashioned Rolled Oats, organic, ${scoreProduct(byCode("0039978013873")).score} out of 100"><div class="pl-org" aria-hidden="true">${img(byCode("0039978013873"), "pl-shot--lg")}<div><b>Rolled oats</b><span>Organic label: 10 of 10</span></div>${ring(scoreProduct(byCode("0039978013873")).score!, "excellent", 56)}</div></div>
        </article>
      </div>
    </div>
  </section>

  <section class="section" id="questions" aria-labelledby="questions-h">
    <div class="wrap">
      <div class="grid">
        <div class="span-5 stack-6">
          <h2 id="questions-h">Questions about Peel</h2>
          <div class="pl-shelf">${SAMPLES.map((p) => img(p)).join("")}</div>
        </div>
        <div class="faq span-6 start-7">
          <div class="faq__item"><h3>Is Peel free?</h3><p>Yes, and MIT licensed. You sign in with publik once; there is no plan to buy and no AI in it.</p></div>
          <div class="faq__item"><h3>Where does the product data come from?</h3><p>Open Food Facts, the open database of food labels that shoppers fill in. A missing product can be added there in two minutes.</p></div>
          <div class="faq__item"><h3>Is it the same score as Yuka?</h3><p>Same split, different maths and a different additive table, so a product can land a few points apart. Peel&apos;s rules are in the code.</p></div>
          <div class="faq__item"><h3>Does the camera upload anything?</h3><p>No. The barcode is read on your phone; only the number goes to Open Food Facts.</p></div>
        </div>
      </div>
    </div>
  </section>
</main>

<footer class="footer closing" id="contact" aria-labelledby="close-h">
  <div class="wrap">
    <div class="closing__cta close--type">
      <div class="section-head">
        <h2 id="close-h">Scan the next thing in your cupboard</h2>
        <p>Free in your phone&apos;s browser. No app store; sign in with publik once.</p>
      </div>
      <a class="btn btn--primary btn--xl btn--wide" href="/app">Scan a product${ARROW}</a>
    </div>
    <div class="closing__links">
      <div class="grid">
        <div class="span-4 stack-4">
          <a class="nav__logo" href="#top"><span class="pl-mark" aria-hidden="true">P</span>Peel</a>
          <p class="footer__lede">A free, open-source grocery scanner, made by Vedant Soni.</p>
        </div>
        <div class="span-2 start-7 footer__col"><h3>App</h3><ul><li><a href="/app">Scanner</a></li><li><a href="/app?code=${doritos.code}">A sample scan</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Page</h3><ul><li><a href="#score">The score</a></li><li><a href="#questions">Questions</a></li></ul></div>
        <div class="span-2 footer__col"><h3>Code</h3><ul><li><a href="${app.repo}">GitHub</a></li><li><a href="${app.repo}/issues">Report a bug</a></li></ul></div>
      </div>
      <div class="footer__legal">
        <span class="pl-legal"><span>&copy; 2026 Vedant Soni</span><a href="${app.repo}/blob/main/LICENSE">MIT licence</a><a href="https://world.openfoodfacts.org/">Data and product photos: Open Food Facts (ODbL, CC BY-SA)</a></span>
        <span>Inspired by Yuka. Not affiliated with it.</span>
      </div>
    </div>
  </div>
</footer>
<nav class="actionbar" aria-label="Quick actions">
  <a class="btn btn--primary" href="/app">Scan a product</a>
</nav>
<script type="module" src="/assets/system.js"></script>
<script type="module" src="/assets/motion/motion.js"></script>
<script type="module" src="/assets/layout/layout.js"></script>
<script type="module" src="/assets/moments/moments.js"></script>
</body>
</html>
`;
}
