// Drives the real first run for tools/capture.mjs (README media, reel B-roll). Fresh browser each run.
// Reel shots (DESIGN.md): a snack scanned, the ring drawing to red; an additive explaining itself; a swap scoring green.
// Headless Chrome has no camera, so the barcode is typed (the app's own fallback). Doritos Nacho Cheese is one of the
// six samples saved from Open Food Facts; its swaps and the swap's own page come live from Open Food Facts.
//   node tools/capture.mjs http://localhost:3311 --steps apps/peel/capture.steps.mjs --out apps/peel/docs/media --video
export default async function ({ page, go, click, type, wait, shot, scroll }) {
  // Open Food Facts' photos can take seconds the first time; wait until every picture on screen has drawn.
  const photos = () => page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 }).catch(() => {});
  // /app sits behind Sign in with publik. Capture against the publik mock (see the studio's /studio skill):
  //   PUBLIK_ORIGIN=http://localhost:3124 PUBLIK_APP_TOKEN=pat_localtest npm run dev
  // The sign-in screen is shot first, then the mock signs this browser in.
  await go("/app");
  await wait(1500);
  if (await page.locator("text=Sign in to start scanning").count()) {
    await shot("screen-6");
    const p = await page.evaluate(async () => fetch("/api/studio/publik/provision", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).then((r) => r.json()));
    if (p.claimUrl) await fetch(p.claimUrl);
    await page.reload();
    await page.locator("#code").waitFor({ timeout: 30000 });
  }
  await wait(700);
  await shot("screen-1");

  // 1. Type the barcode under the stripes; the score ring draws to red.
  await type("#code", "0028400090896", { delay: 60 });
  await click('button:has-text("Look it up")');
  await page.getByText("Bad", { exact: true }).first().waitFor({ timeout: 30000 });
  await wait(1400);
  await shot("screen-2");

  // 2. Tap an additive: it says what it is and why it matters.
  await click("summary:has-text('Tartrazine')");
  await wait(900);
  await click("summary:has-text('Allura red')");
  await wait(1100);

  // 3. Better swaps from the same shelf, then open the best one.
  await page.locator("text=Better swaps").scrollIntoViewIfNeeded();
  await wait(400);
  await page.locator("section:has-text('Better swaps') li button").first().waitFor({ timeout: 45000 });
  await page.evaluate(() => document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager")));
  await photos();
  await wait(600);
  await shot("screen-3");
  await click("section:has-text('Better swaps') li button >> nth=0");
  await page.waitForURL(/code=(?!0028400090896)/, { timeout: 30000 });
  await page.locator(".pl-ring").first().waitFor({ timeout: 30000 });
  await photos();
  await wait(1200);
  await shot("screen-4");

  // The landing, last.
  await go("/");
  await wait(1200);
  await shot("cover", { cover: true });
  await shot("screen-5");
  void scroll;
}
