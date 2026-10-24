// node scripts/roadmap-pdf.mjs [docs/ROADMAP.md] [out.pdf]
// Renders the roadmap checklist to a PDF with ticked and empty boxes and a
// progress count. Needs Playwright installed globally (not a project dependency):
//   NODE_PATH=$(npm root -g) node scripts/roadmap-pdf.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createRequire } from "node:module";

// Playwright is not a project dependency; resolve it from the project or NODE_PATH.
const require = createRequire(import.meta.url);
const searchPaths = [process.cwd(), ...(process.env.NODE_PATH ?? "").split(":").filter(Boolean)];
const { chromium } = require(require.resolve("playwright", { paths: searchPaths }));

const src = process.argv[2] ?? "docs/ROADMAP.md";
const md = readFileSync(src, "utf8");
const updated = md.match(/^Updated: (\d{4}-\d{2}-\d{2})/m)?.[1] ?? new Date().toISOString().slice(0, 10);
const out = process.argv[3] ?? `docs/reports/roadmap-${updated}.pdf`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");

let done = 0;
let total = 0;
const body = [];
let list = false;
for (const line of md.split("\n")) {
  const item = line.match(/^- \[( |x)\] (.*)$/);
  if (!item && list) {
    body.push("</ul>");
    list = false;
  }
  if (item) {
    const checked = item[1] === "x";
    total++;
    if (checked) done++;
    if (!list) {
      body.push('<ul class="checks">');
      list = true;
    }
    body.push(`<li class="${checked ? "done" : ""}"><span class="box">${checked ? "✓" : ""}</span><span>${inline(item[2])}</span></li>`);
  } else if (line.startsWith("# ")) body.push(`<h1>${inline(line.slice(2))}</h1>`);
  else if (line.startsWith("## ")) body.push(`<h2>${inline(line.slice(3))}</h2>`);
  else if (line.trim()) body.push(`<p>${inline(line)}</p>`);
}
if (list) body.push("</ul>");
const pct = total ? Math.round((done / total) * 100) : 0;
body.splice(1, 0, `<div class="progress"><div class="bar"><span style="width:${pct}%"></span></div><strong>${done} of ${total} done (${pct}%)</strong></div>`);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { font: 11pt/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; color: #1a1a1a; margin: 0; }
  h1 { font-size: 20pt; margin: 0 0 6px; }
  h2 { font-size: 12.5pt; margin: 22px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #ddd; break-after: avoid; }
  p { margin: 4px 0; color: #444; }
  code { font-size: 0.92em; background: #f2f2f2; padding: 0 3px; border-radius: 3px; }
  .progress { display: flex; align-items: center; gap: 12px; margin: 10px 0 4px; }
  .bar { flex: 1; height: 8px; background: #e6e6e6; border-radius: 4px; overflow: hidden; }
  .bar span { display: block; height: 100%; background: #0e5c57; }
  .checks { list-style: none; padding: 0; margin: 0; }
  .checks li { display: flex; gap: 10px; align-items: flex-start; padding: 5px 0; break-inside: avoid; }
  .box { flex: none; width: 14px; height: 14px; margin-top: 2px; border: 1.5px solid #555; border-radius: 3px;
         font-size: 11px; line-height: 13px; text-align: center; font-weight: 700; color: #fff; }
  .done .box { background: #0e5c57; border-color: #0e5c57; }
  .done span:last-child { color: #666; }
</style></head><body>${body.join("\n")}</body></html>`;

mkdirSync(dirname(out), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.pdf({
  path: out,
  format: "A4",
  printBackground: true,
  margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: `<div style="font-size:8pt;color:#888;width:100%;text-align:center">KRIV Previews roadmap · ${updated} · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
});
await browser.close();
console.log(`wrote ${out} (${done}/${total} done)`);
