"use client";
// The app at "/app": scan (or type) a barcode, see the score. /app?code=<barcode> opens a product, so the back button,
// sharing and swaps all work. Scoring needs no AI; only "Peel's take" asks for a mode.
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ModeButton } from "@/kit/react/ModePanel";
import { Scanner } from "@/components/Scanner";
import { ProductView, ScoreRing, type Loaded } from "@/components/ProductView";
import { SAMPLES } from "@/lib/samples";
import { scoreProduct, type Band } from "@/lib/score";

type Recent = { code: string; name: string; brand: string; image: string | null; score: number | null; band: Band | null };
const KEY = "peel.recent";
const readRecent = (): Recent[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Recent[]; } catch { return []; } };

export default function AppPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          <Link href="/app" className="flex min-h-11 items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><circle cx="12" cy="12" r="10" fill="var(--accent)" /><path d="M8 12.5l2.6 2.6L16 9.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Peel
          </Link>
          <ModeButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:pb-16">
        <Suspense fallback={<div className="sk-spinner mx-auto mt-20" />}><Peel /></Suspense>
      </main>
    </div>
  );
}

function Peel() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code");
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<{ code: string; message: string; missing: boolean } | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => { setRecent(readRecent()); }, []);

  const open = useCallback((c: string) => { router.push(`/app?code=${encodeURIComponent(c)}`); }, [router]);

  useEffect(() => {
    if (!code) { setData(null); setError(null); return; }
    let live = true;
    setError(null);
    // A sample opens instantly from the bundle; anything else asks the server (which asks Open Food Facts).
    const sample = SAMPLES.find((s) => s.code === code);
    const load: Promise<Loaded> = sample
      ? Promise.resolve({ product: sample, scored: scoreProduct(sample), sample: true })
      : fetch(`/api/product/${encodeURIComponent(code)}`).then(async (r) => {
          const j = await r.json();
          if (!r.ok) throw Object.assign(new Error(j.error ?? "Something went wrong."), { missing: r.status === 404 });
          return j as Loaded;
        });
    setData((d) => (d?.product.code === code ? d : null));
    load.then((d) => {
      if (!live) return;
      setData(d);
      window.scrollTo({ top: 0 });
      const item: Recent = { code: d.product.code, name: d.product.name, brand: d.product.brand, image: d.product.image, score: d.scored.score, band: d.scored.band };
      const next = [item, ...readRecent().filter((r) => r.code !== item.code)].slice(0, 12);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: no history */ }
      setRecent(next);
    }).catch((e: Error & { missing?: boolean }) => live && setError({ code, message: e.message, missing: Boolean(e.missing) }));
    return () => { live = false; };
  }, [code]);

  if (code) {
    return (
      <div>
        <button type="button" onClick={() => router.push("/app")} className="sk-btn sk-btn-quiet mb-4 !hidden !pl-3 lg:!inline-flex">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8" /></svg>
          Scan another
        </button>
        {error ? (
          <div className="sk-shake mx-auto max-w-lg rounded-[var(--radius)] border border-line bg-card p-6 text-center shadow-[var(--shadow-1)]" role="alert">
            <p className="text-xl font-medium">{error.missing ? "We don't know this one yet" : "Couldn't load it"}</p>
            <p className="mt-2 text-muted">{error.missing ? <>Barcode <span className="pl-num font-mono">{error.code}</span> isn&apos;t in Open Food Facts. You can add it there in two minutes, and every app that uses it gets better.</> : error.message}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {error.missing ? <a className="sk-btn" href="https://world.openfoodfacts.org/contribute" target="_blank" rel="noopener noreferrer">Add it to Open Food Facts</a> : <button type="button" className="sk-btn" onClick={() => router.refresh()}>Try again</button>}
              <button type="button" className="sk-btn sk-btn-quiet" onClick={() => router.push("/app")}>Scan something else</button>
            </div>
          </div>
        ) : data ? (
          <>
            <ProductView key={data.product.code} data={data} onOpen={open} />
            {/* on a phone the next scan sits under the thumb (Fitts) */}
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/92 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
              <button type="button" onClick={() => router.push("/app")} className="sk-btn !min-h-12 w-full">Scan another</button>
            </div>
          </>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[5fr_7fr]" aria-label="Loading the product">
            <div className="h-[420px] animate-pulse rounded-[var(--radius)] bg-bg-2" />
            <div className="grid gap-5"><div className="h-40 animate-pulse rounded-[var(--radius)] bg-bg-2" /><div className="h-56 animate-pulse rounded-[var(--radius)] bg-bg-2" /></div>
          </div>
        )}
      </div>
    );
  }

  return <Home onCode={open} recent={recent} />;
}

function Home({ onCode, recent }: { onCode: (c: string) => void; recent: Recent[] }) {
  const [typed, setTyped] = useState("");
  const [bad, setBad] = useState(false);
  const submit = () => {
    const d = typed.replace(/\D/g, "");
    if (d.length < 8 || d.length > 14) { setBad(true); setTimeout(() => setBad(false), 260); return; }
    onCode(d);
  };
  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <div className="sk-stagger">
        <h1 className="text-3xl leading-tight sm:text-4xl">What&apos;s really in it?</h1>
        <p className="mt-2 text-lg text-muted">Scan a grocery barcode for a 0–100 health score: nutrition, additives and organic.</p>
      </div>

      <Scanner onCode={onCode} />

      <form className={`flex gap-2 ${bad ? "sk-shake" : ""}`} onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label className="sr-only" htmlFor="code">Barcode number</label>
        <input id="code" value={typed} onChange={(e) => setTyped(e.target.value)} inputMode="numeric" autoComplete="off" placeholder="Or type the barcode number"
          className={`min-h-12 flex-1 rounded-full border bg-white px-5 font-mono text-[15px] outline-none focus:border-accent focus:shadow-[var(--focus)] ${bad ? "border-[var(--danger)]" : "border-line"}`} />
        <button type="submit" className="sk-btn !min-h-12" disabled={!typed.trim()}>Look it up</button>
      </form>

      <section>
        <h2 className="text-lg">Try a sample <span className="text-muted">real products, saved from Open Food Facts</span></h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SAMPLES.map((p) => { const s = scoreProduct(p); return (
            <li key={p.code}>
              <button type="button" onClick={() => onCode(p.code)} className="pl-row-btn flex w-full items-center gap-3 rounded-[var(--radius-sm)] border border-line bg-card p-2.5 text-left shadow-[var(--shadow-1)]">
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-white">{p.image && <img src={p.image} alt="" className="h-full w-full object-contain" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-medium">{p.name}</span><span className="flex items-center gap-1.5 text-sm text-muted" data-band={s.band ?? undefined}><span className="pl-dot" /><span className="pl-num">{s.score}</span>/100</span></span>
              </button>
            </li>
          ); })}
        </ul>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="text-lg">Your scans <span className="text-muted">kept on this device</span></h2>
          <ul className="mt-2 divide-y divide-line">
            {recent.map((r) => (
              <li key={r.code}>
                <button type="button" onClick={() => onCode(r.code)} className="pl-row-btn -mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-[12px] px-2 py-2.5 text-left">
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-line bg-white">{r.image && <img src={r.image} alt="" className="h-full w-full object-contain p-0.5" loading="lazy" />}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{r.name}</span><span className="block truncate text-sm text-muted">{r.brand}</span></span>
                  <ScoreRing score={r.score} band={r.band} size={46} animate={false} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
