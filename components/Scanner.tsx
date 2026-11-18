"use client";
// The camera viewfinder. Reads EAN-13, EAN-8, UPC-A and UPC-E with the browser's own BarcodeDetector where it exists
// (Chrome on Android) and the same API from zxing-wasm everywhere else (Safari, Firefox, desktop). The wasm file is
// served from this app (public/zxing_reader.wasm), never a CDN.
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "starting" | "live" | "denied" | "nocam";

export function Scanner({ onCode, autoStart = false }: { onCode: (code: string) => void; autoStart?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const stop = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setPhase("nocam"); return; }
    setPhase("starting");
    try {
      const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill");
      prepareZXingModule({ overrides: { locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? "/zxing_reader.wasm" : prefix + path) } });
      const formats = ["ean_13", "ean_8", "upc_a", "upc_e"] as const;
      type Native = { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> };
      const Native = (globalThis as unknown as { BarcodeDetector?: { new (o: { formats: string[] }): Native; getSupportedFormats(): Promise<string[]> } }).BarcodeDetector;
      const nativeOk = Native ? (await Native.getSupportedFormats().catch(() => [] as string[])).includes("ean_13") : false;
      const detector: Native = nativeOk && Native ? new Native({ formats: [...formats] }) : new BarcodeDetector({ formats: [...formats] });

      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      stream.current = s;
      const v = video.current!;
      v.srcObject = s;
      await v.play();
      setPhase("live");
      let last = "", hits = 0;
      const tick = async () => {
        if (!stream.current) return;
        try {
          const found = v.readyState >= 2 ? await detector.detect(v) : [];
          const code = found[0]?.rawValue?.replace(/\D/g, "");
          // Two matching reads in a row before we trust it: a half-seen barcode can misread once.
          if (code && code.length >= 8) {
            hits = code === last ? hits + 1 : 1; last = code;
            if (hits >= 2) { navigator.vibrate?.(30); stop(); onCode(code); return; }
          }
        } catch { /* a frame that couldn't be read: try the next */ }
        timer.current = window.setTimeout(tick, 120);
      };
      void tick();
    } catch (e) {
      stop();
      setPhase((e as Error).name === "NotAllowedError" || (e as Error).name === "SecurityError" ? "denied" : "nocam");
    }
  }, [onCode, stop]);

  useEffect(() => { if (autoStart) void start(); return stop; }, [autoStart, start, stop]);

  const live = phase === "live";
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius)] bg-[#0f0f0f] shadow-[var(--shadow-2)] sm:aspect-[16/10]">
      <video ref={video} playsInline muted className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${live ? "opacity-100" : "opacity-0"}`} />
      {/* the reticle: four corners and the scan line */}
      <div aria-hidden className="pointer-events-none absolute inset-[14%_10%]">
        <span className="pl-corner pl-tl" /><span className="pl-corner pl-tr" /><span className="pl-corner pl-bl" /><span className="pl-corner pl-br" />
      </div>
      {live && <div aria-hidden className="pl-scanline" />}
      {live && <p className="absolute inset-x-0 bottom-4 text-center text-sm font-medium text-white/90 [text-shadow:0_1px_8px_rgb(0_0_0/.6)]">Hold the barcode inside the frame</p>}
      {live && <button type="button" onClick={() => { stop(); setPhase("idle"); }} className="sk-btn sk-btn-quiet absolute right-3 top-3 !bg-black/55 !text-white backdrop-blur">Stop camera</button>}

      {!live && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
          {phase === "starting" ? (
            <div className="sk-spinner" aria-label="Starting the camera" />
          ) : phase === "denied" || phase === "nocam" ? (
            <div className="sk-shake max-w-xs" role="alert">
              <p className="text-lg font-medium">{phase === "denied" ? "The camera is blocked" : "No camera here"}</p>
              <p className="mt-1 text-sm text-white/75">{phase === "denied" ? "Allow it in your browser's site settings, then try again. Or type the barcode below." : "Type the barcode below, or try a sample product."}</p>
              {phase === "denied" && <button type="button" onClick={() => void start()} className="sk-btn mt-4 !bg-white !text-[#111]">Try the camera again</button>}
            </div>
          ) : (
            <div>
              <button type="button" onClick={() => void start()} className="sk-btn !min-h-14 !bg-white !px-7 !text-base !text-[#111]">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8" /></svg>
                Scan a barcode
              </button>
              <p className="mt-3 text-sm text-white/70">Uses your camera. Nothing is uploaded.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
