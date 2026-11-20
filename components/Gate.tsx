"use client";
// Sign in with publik in front of /app (every studio build signs in through the builds hub's publik listing). The
// landing at "/" stays open. Peel has no AI, so signed in is enough (usesAi: false: no plan or key step). Once open,
// the app renders inside <StudioProvider>, which counts usage for the builds hub and publik.
import Link from "next/link";
import type { ReactNode } from "react";
import { StudioProvider } from "@/kit/react/studio";
import { usePublikGate } from "@/kit/react/gate";
import type { GateAction } from "@/kit/ai/publik"; // types only
import { SAMPLES } from "@/lib/samples";
import { scoreProduct } from "@/lib/score";
import { ScoreRing } from "@/components/ProductView";
import config from "@/studio.config";

export function Gate({ children }: { children: ReactNode }) {
  const g = usePublikGate({ usesAi: false });
  if (g.open) return <StudioProvider>{children}</StudioProvider>;

  const shown = g.shown;
  const asking = g.signingIn || g.loading;
  const title = asking ? "Sign in to start scanning" : shown?.screen.title ?? "Sign in with publik";
  const body = asking
    ? "Peel is free. Sign in with publik once, then scan any grocery barcode for its score out of 100."
    : shown?.screen.body ?? "";

  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden><circle cx="12" cy="12" r="10" fill="var(--accent)" /><path d="M8 12.5l2.6 2.6L16 9.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Peel
          </Link>
          <a href={config.app.repo} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center text-sm text-muted transition-colors duration-150 hover:text-fg">Open source</a>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-10 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:items-center lg:gap-20" aria-busy={g.busy}>
        <section className="sk-stagger max-w-xl">
          <h1 className="text-4xl leading-[1.05] sm:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{body}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {g.loading && <span className="sk-btn inline-flex items-center opacity-70" aria-label="Loading"><span className="sk-spinner" aria-hidden /></span>}
            {g.needsInstall && <button type="button" className="sk-btn !min-h-12" disabled={g.busy} onClick={() => void g.provision()}>Sign in with publik</button>}
            {shown?.screen.buttons.map((b, i) => <GateButton key={b.action} action={b.action} label={b.label} primary={i === 0} href={g.hrefFor(b.action)} busy={g.busy} onAct={g.act} />)}
          </div>
          {g.note && (
            <p className="mt-5 flex items-center gap-2.5 text-sm text-muted" role="status">
              {g.waiting && <span className="sk-spinner" aria-hidden />}
              {g.note}
            </p>
          )}
          {g.signingIn && <p className="mt-5 text-sm text-muted">publik opens in a new tab the first time. Come back here once you&rsquo;re signed in.</p>}
          <noscript><p className="mt-5 text-sm text-muted">Turn on JavaScript to sign in with publik.</p></noscript>
          <ul className="mt-10 grid gap-2 border-t border-line pt-6 text-sm text-muted">
            <li>Scores come from Open Food Facts, the open food database. No AI, nothing to pay.</li>
            <li>A free alternative to {config.app.alternativeTo} Premium ($15 a year). Open source, MIT.</li>
            <li>Signing in through <a href="https://publikhq.com" target="_blank" rel="noopener noreferrer" className="text-fg underline decoration-line underline-offset-4 hover:decoration-fg">publik</a> keeps Peel free.</li>
          </ul>
        </section>
        <Behind />
      </main>
    </div>
  );
}

/** What's behind the sign-in: the six sample products with their real scores. */
function Behind() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Products scored in Peel">
      {SAMPLES.map((p, i) => {
        const s = scoreProduct(p);
        return (
          <li key={p.code} className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-line bg-card p-4 text-center shadow-[var(--shadow-1)]" style={{ animation: `sk-rise var(--dur-3) var(--spring) ${120 + i * 50}ms both` }}>
            <span className="grid size-20 place-items-center overflow-hidden rounded-[12px] bg-white">{p.image && <img src={p.image} alt="" className="h-full w-full object-contain" />}</span>
            <span className="w-full truncate text-sm font-medium">{p.name}</span>
            <ScoreRing score={s.score} band={s.band} size={56} animate={false} />
          </li>
        );
      })}
    </ul>
  );
}

function GateButton({ action, label, primary, href, busy, onAct }: { action: GateAction; label: string; primary: boolean; href: string | null; busy: boolean; onAct: (a: GateAction) => Promise<void> }) {
  const cls = `sk-btn !min-h-12 ${primary ? "" : "sk-btn-quiet"}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} inline-flex items-center`}
        onClick={() => void onAct(action)} onAuxClick={(e) => { if (e.button === 1) void onAct(action); }}>{label}</a>
    );
  }
  return <button type="button" className={cls} disabled={busy} onClick={() => void onAct(action)}>{label}</button>;
}
