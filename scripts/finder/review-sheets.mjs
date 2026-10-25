// NODE_PATH=$(npm root -g) node scripts/finder/review-sheets.mjs <to-review.json> <outDir> [from] [count]
// Visual review step (docs/LEAD-FINDER.md): screenshots each site's homepage as a visitor sees it
// on load (desktop 1440x900, plus the top of the phone view) and writes contact sheets of 9 sites
// (sheet-NN.png) for a person or Claude to grade against the dated/amateur checklist. Run in
// batches of about 20 on low-memory machines. Output holds business data: keep outDir outside Git.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const searchPaths = [process.cwd(), ...(process.env.NODE_PATH ?? "").split(":").filter(Boolean)];
const { chromium, devices } = require(require.resolve("playwright", { paths: searchPaths }));

const [list, outDir, from = "0", count = "20"] = process.argv.slice(2);
const rows = JSON.parse(readFileSync(list, "utf8")).slice(Number(from), Number(from) + Number(count));
mkdirSync(join(outDir, "shots"), { recursive: true });
const browser = await chromium.launch();
const done = [];
for (const [i, r] of rows.entries()) {
  const n = Number(from) + i;
  const file = (k) => join(outDir, "shots", `${String(n).padStart(3, "0")}-${k}.png`);
  if (existsSync(file("d"))) { done.push(n); continue; }
  try {
    const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await d.goto(r.website, { waitUntil: "load", timeout: 25000 });
    await d.waitForTimeout(2500);
    await d.screenshot({ path: file("d") });
    await d.close();
    const p = await browser.newContext({ ...devices["iPhone 13"] }).then((c) => c.newPage());
    await p.goto(r.website, { waitUntil: "load", timeout: 25000 });
    await p.waitForTimeout(2000);
    await p.screenshot({ path: file("p") });
    await p.context().close();
    done.push(n);
    console.error(`ok ${n} ${r.website}`);
  } catch (e) {
    console.error(`FAIL ${n} ${r.website} ${String(e.message).split("\n")[0]}`);
  }
}
// Contact sheets: 9 per sheet, desktop with the phone view inset, labelled with index and host.
const all = JSON.parse(readFileSync(list, "utf8"));
const have = all.map((r, n) => ({ r, n })).filter(({ n }) => existsSync(join(outDir, "shots", `${String(n).padStart(3, "0")}-d.png`)));
const sheets = [];
for (let s = 0; s * 9 < have.length; s++) {
  const cells = have.slice(s * 9, s * 9 + 9).map(({ r, n }) => {
    const id = String(n).padStart(3, "0");
    const src = (k) => `file:///${join(outDir, "shots", `${id}-${k}.png`).replace(/\\/g, "/")}`;
    const ph = existsSync(join(outDir, "shots", `${id}-p.png`)) ? `<img class="p" src="${src("p")}">` : "";
    return `<figure><div class="w"><img class="d" src="${src("d")}">${ph}</div><figcaption>#${n} ${new URL(r.website).hostname.replace(/^www\./, "")}</figcaption></figure>`;
  });
  const html = `<!doctype html><style>body{margin:0;background:#fff;font:14px system-ui}main{display:grid;grid-template-columns:repeat(3,600px);gap:10px;padding:10px}.w{position:relative}.d{width:600px;display:block;border:1px solid #ccc}.p{position:absolute;right:4px;bottom:4px;width:120px;border:1px solid #333}figure{margin:0}figcaption{padding:2px 0;font-weight:600}</style><main>${cells.join("")}</main>`;
  const f = join(outDir, `sheet-${String(s).padStart(2, "0")}.html`);
  writeFileSync(f, html);
  sheets.push(f);
}
for (const f of sheets) {
  const pg = await browser.newPage({ viewport: { width: 1840, height: 1200 } });
  await pg.goto(`file:///${f.replace(/\\/g, "/")}`);
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: f.replace(/\.html$/, ".png"), fullPage: true });
  await pg.close();
}
await browser.close();
console.error(`${done.length} shot in this batch, ${sheets.length} sheets`);
