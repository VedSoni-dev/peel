"use client";
// One scanned product: the score, why, the nutrients, each additive, Peel's take (AI) and healthier swaps.
import { useEffect, useState } from "react";
import { useAI } from "@/kit/react/studio";
import { BAND_LABEL, type Band, type Product, type Scored } from "@/lib/score";
import type { Swap } from "@/lib/off";

export type Loaded = { product: Product; scored: Scored; sample: boolean };

const RISK_LABEL = { none: "No risk", limited: "Limited risk", moderate: "Moderate risk", high: "High risk" } as const;

export function ScoreRing({ score, band, size = 132, animate = true }: { score: number | null; band: Band | null; size?: number; animate?: boolean }) {
  const r = 44, c = 2 * Math.PI * r;
  const [shown, setShown] = useState(animate ? 0 : score ?? 0);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(score ?? 0)); return () => cancelAnimationFrame(id); }, [score]);
  return (
    <div className="pl-ring relative grid shrink-0 place-items-center" style={{ width: size, height: size }} data-band={band ?? undefined}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--bg-2)" strokeWidth="8" />
        {score !== null && <circle className="pl-arc" cx="50" cy="50" r={r} fill="none" stroke="var(--c)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} />}
      </svg>
      <div className="text-center leading-none">
        <span className="pl-num font-display font-medium tracking-tight" style={{ fontSize: size * 0.32 }}>{score ?? "?"}</span>
        <span className="block text-muted" style={{ fontSize: Math.max(11, size * 0.1) }}>/100</span>
      </div>
    </div>
  );
}

function Part({ label, value, max }: { label: string; value: number | null; max: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="text-muted">{label}</span><span className="pl-num font-medium">{value ?? "?"}<span className="text-muted">/{max}</span></span></div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-2"><div className="h-full rounded-full bg-fg transition-[width] duration-500 ease-[var(--ease-out)]" style={{ width: `${((value ?? 0) / max) * 100}%` }} /></div>
    </div>
  );
}

export function ProductView({ data, onOpen }: { data: Loaded; onOpen: (code: string) => void }) {
  const { product: p, scored: s } = data;
  const per = s.drink ? "100 ml" : "100 g";
  return (
    <div className="sk-stagger grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
      {/* left: what it is and how it scores */}
      <section className="rounded-[var(--radius)] border border-line bg-card p-5 shadow-[var(--shadow-1)] sm:p-6 lg:sticky lg:top-20">
        <div className="flex gap-4">
          <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] border border-line bg-white sm:size-28">
            {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-contain p-1.5" /> : <span className="text-xs text-muted">No photo</span>}
          </div>
          <div className="min-w-0 pt-1">
            {data.sample && <span className="sk-tag mb-1.5 inline-block">Sample product</span>}
            <h1 className="text-2xl leading-tight sm:text-[28px]">{p.name}</h1>
            <p className="mt-1 text-muted">{[p.brand, p.quantity].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-5">
          <ScoreRing score={s.score} band={s.band} />
          <div>
            <p className="flex items-center gap-2 text-2xl font-medium" data-band={s.band ?? undefined}><span className="pl-dot" />{s.band ? BAND_LABEL[s.band] : "Not enough data"}</p>
            {s.capped && <p className="mt-1 text-sm text-muted">Capped at 49: it has a high-risk additive.</p>}
            {s.score === null && <p className="mt-1 text-sm text-muted">Open Food Facts has no nutrition facts for it yet.</p>}
          </div>
        </div>
        {s.reasons.length > 0 && <ul className="mt-5 flex flex-wrap gap-2">{s.reasons.map((r) => <li key={r} className="rounded-full bg-bg-2 px-3 py-1.5 text-sm">{r}</li>)}</ul>}
        <div className="mt-6 grid gap-3 border-t border-line pt-5">
          <Part label="Nutrition" value={s.parts.nutrition} max={60} />
          <Part label="Additives" value={s.parts.additives} max={30} />
          <Part label="Organic" value={s.parts.organic} max={10} />
        </div>
        <p className="mt-4 text-xs text-muted">Barcode {p.code} · data from <a className="underline underline-offset-2" href={`https://world.openfoodfacts.org/product/${p.code}`} target="_blank" rel="noopener noreferrer">Open Food Facts</a></p>
      </section>

      {/* right: the detail */}
      <div className="grid gap-5">
        <Take product={p} />

        <section className="rounded-[var(--radius)] border border-line bg-card p-5 shadow-[var(--shadow-1)] sm:p-6">
          <h2 className="text-lg">Nutrition <span className="text-muted">per {per}</span></h2>
          {s.nutrients.length ? (
            <ul className="mt-3 divide-y divide-line">
              {s.nutrients.map((n) => (
                <li key={n.key} className="flex min-h-12 items-center gap-3 py-2">
                  <span className="pl-dot" data-band={n.good ? "excellent" : n.level === "moderate" ? "poor" : "bad"} />
                  <span className="flex-1">{n.label}</span>
                  <span className="text-sm text-muted">{n.good ? (n.key === "fiber" || n.key === "proteins" ? (n.level === "high" ? "Plenty" : "Some") : "Low") : n.level === "moderate" ? "Moderate" : "High"}</span>
                  <span className="pl-num w-20 text-right font-medium">{+n.value.toFixed(n.value < 10 ? 1 : 0)} {n.unit}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-muted">No nutrition facts listed for this product.</p>}
        </section>

        <section className="rounded-[var(--radius)] border border-line bg-card p-5 shadow-[var(--shadow-1)] sm:p-6">
          <h2 className="text-lg">Additives <span className="text-muted">{s.additives.length || "none"}</span></h2>
          {s.additives.length ? (
            <ul className="mt-3 divide-y divide-line">
              {s.additives.map((a) => (
                <li key={a.code}>
                  <details className="group">
                    <summary className="pl-row-btn -mx-2 flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-[10px] px-2 py-2">
                      <span className="pl-dot" data-risk={a.unrated ? "unrated" : a.risk} />
                      <span className="flex-1"><span className="font-mono text-sm">{a.code}</span>{a.name && <span> {a.name}</span>}</span>
                      <span className="text-sm text-muted">{a.unrated ? "Not rated" : RISK_LABEL[a.risk]}</span>
                      <svg viewBox="0 0 12 12" width="12" height="12" className="text-muted transition-transform duration-150 group-open:rotate-180" aria-hidden><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </summary>
                    <p className="pb-3 pl-7 pr-2 text-[15px] text-muted">{a.note}</p>
                  </details>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-muted">None listed on the label.</p>}
        </section>

        <Swaps code={p.code} onOpen={onOpen} />
      </div>
    </div>
  );
}

/** "Peel's take": the one AI part. Streams through whichever mode the person picked; the picker opens if none. */
function Take({ product }: { product: Product }) {
  const ai = useAI();
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  useEffect(() => { ai.setText(""); setAsked(null); setQ(""); }, [product.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (question?: string) => { setAsked(question ?? null); void ai.run({ product, question }); };
  // **Lead:** → bold lead-ins; nothing else from the model is treated as markup.
  const lines = ai.text.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <section className="rounded-[var(--radius)] border border-line bg-card p-5 shadow-[var(--shadow-1)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg">Peel&apos;s take</h2>
        {!ai.text && !ai.busy && <button type="button" className="sk-btn" onClick={() => go()}>Get Peel&apos;s take</button>}
      </div>
      {!ai.text && !ai.busy && !ai.error && <p className="mt-1 text-muted">A plain read of this label, written by AI from the data on this page.</p>}
      {asked && <p className="mt-3 text-sm text-muted">You asked: {asked}</p>}
      {(ai.text || ai.busy) && (
        <div className="pl-take mt-3 grid gap-2 text-[16px] leading-relaxed" aria-live="polite">
          {lines.length ? lines.map((l, i) => {
            const m = l.replace(/^[-*•]\s*/, "").match(/^\*\*(.+?)\*\*\s*(.*)$/);
            return <p key={i}>{m ? <><strong>{m[1]}</strong> {m[2].replace(/\*\*/g, "")}</> : l.replace(/\*\*/g, "")}</p>;
          }) : <p className="flex items-center gap-2 text-muted"><span className="sk-spinner !size-4" /> Reading the label…</p>}
        </div>
      )}
      {ai.error && <p className="sk-error sk-shake mt-3" role="alert">{ai.error.message}{ai.error.action && <> <a href={ai.error.action.url} target="_blank" rel="noopener noreferrer">{ai.error.action.label} ↗</a></>}</p>}
      {(ai.text && !ai.busy) && (
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = q.trim(); if (t) { go(t); setQ(""); } }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about it: is it OK for kids?" aria-label="Ask a question about this product"
            className="min-h-11 flex-1 rounded-full border border-line bg-white px-4 outline-none focus:border-accent focus:shadow-[var(--focus)]" />
          <button type="submit" className="sk-btn sk-btn-quiet" disabled={!q.trim()}>Ask</button>
        </form>
      )}
      {ai.busy && <button type="button" className="sk-btn sk-btn-quiet mt-3" onClick={ai.stop}>Stop</button>}
    </section>
  );
}

function Swaps({ code, onOpen }: { code: string; onOpen: (code: string) => void }) {
  const [state, setState] = useState<{ code: string; swaps: Swap[] | null; error: string | null }>({ code, swaps: null, error: null });
  useEffect(() => {
    let live = true;
    setState({ code, swaps: null, error: null });
    fetch(`/api/swaps?code=${code}`).then((r) => r.json()).then((j: { swaps?: Swap[]; error?: string }) => {
      if (live) setState({ code, swaps: j.swaps ?? [], error: j.error ?? null });
    }).catch(() => live && setState({ code, swaps: [], error: "Couldn't load swaps right now." }));
    return () => { live = false; };
  }, [code]);
  const { swaps, error } = state;
  return (
    <section className="rounded-[var(--radius)] border border-line bg-card p-5 shadow-[var(--shadow-1)] sm:p-6">
      <h2 className="text-lg">Better swaps</h2>
      <p className="mt-1 text-muted">From the same shelf, scoring higher.</p>
      {swaps === null ? (
        <ul className="mt-3 grid gap-2" aria-label="Loading swaps">{[0, 1, 2].map((i) => <li key={i} className="h-16 animate-pulse rounded-[var(--radius-sm)] bg-bg-2" />)}</ul>
      ) : swaps.length ? (
        <ul className="mt-3 grid gap-1">
          {swaps.map(({ product: p, scored: s }) => (
            <li key={p.code}>
              <button type="button" onClick={() => onOpen(p.code)} className="pl-row-btn -mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-[12px] px-2 py-2 text-left">
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-line bg-white">{p.image && <img src={p.image} alt="" className="h-full w-full object-contain p-1" loading="lazy" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.name}</span><span className="block truncate text-sm text-muted">{p.brand}</span></span>
                <span className="flex items-center gap-2" data-band={s.band ?? undefined}><span className="pl-dot" /><span className="pl-num font-medium">{s.score}</span></span>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-muted">{error ?? "Nothing on this shelf scores higher yet. That's a good sign."}</p>}
    </section>
  );
}
