// Looks at a draft the way docs/LEAD-QA.md says: `next dev` on port 3100 (drafts are only served
// there), screenshots with scripts/shoot.mjs, and the QA checklist read from docs/LEAD-QA.md with
// the items a script can verify ticked automatically. The rest are Kriv's ticks.
import { spawn, execFile } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const DEV_PORT = 3100;
const DEV = `http://localhost:${DEV_PORT}/for`;
let devServer = null;

async function devUp() {
  try { const r = await fetch(`${DEV}/test-lead`); return r.status === 200; } catch { return false; }
}

/** Starts `next dev -p 3100` unless something already serves it; stopped when the desk stops. */
export async function ensureDev(repo, say = () => {}) {
  if (await devUp()) return;
  if (!devServer) {
    say("starting the preview app (next dev on port 3100)...");
    devServer = spawn(process.execPath, [join(repo, "node_modules", "next", "dist", "bin", "next"), "dev", "-p", String(DEV_PORT)], { cwd: repo, stdio: "ignore" });
    devServer.on("exit", () => (devServer = null));
    process.on("exit", () => devServer?.kill());
  }
  for (let i = 0; i < 120; i++) {
    if (await devUp()) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("The preview app did not start on port 3100.");
}

/** The QA checklist from docs/LEAD-QA.md: sections 1 to 5, each "- [ ]" line one item. */
export function qaChecklist(repo) {
  const out = [];
  let section = "";
  for (const line of readFileSync(join(repo, "docs", "LEAD-QA.md"), "utf8").split(/\r?\n/)) {
    const h = line.match(/^## (\d)\. (.*)$/);
    if (h) section = Number(h[1]) <= 5 ? `${h[1]}. ${h[2]}` : "";
    const m = line.match(/^- \[ \] (.*)$/);
    if (m && section) out.push({ section, item: m[1] });
  }
  return out;
}

const notice = (name) => `Concept preview prepared by KRIV for ${name}. Not affiliated with or endorsed by ${name}.`;
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** Automatic checks against the served draft. Returns { [item text]: { pass, why } }. */
export async function autoChecks(rec, { schemaOk, shootOk }) {
  const res = await fetch(`${DEV}/${rec.slug}`);
  const html = await res.text();
  const body = html.split("</head>")[1] ?? "";
  const name = rec.business.name.replace(/&/g, "&amp;").replace(/'/g, "&#x27;");
  const hrefs = [...body.matchAll(/href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const badLinks = hrefs.filter((h) => !h.startsWith("#") && !(/^https:\/\/unsplash\.com\//.test(h) && h.includes("utm_source=kriv_previews") && h.includes("utm_medium=referral")));
  const stock = (rec.brand?.photoCredits ?? []).filter((c) => c.provider === "Unsplash");
  const r = (pass, why) => ({ pass, why });
  return {
    "`pnpm test` passes": r(schemaOk && res.status === 200, schemaOk ? `schema valid, page answers ${res.status} (pnpm test runs again before publishing)` : "schema problems"),
    "Banner at the top": r(body.split(notice(name)).length - 1 >= 2, "banner text found at the top and in the footer"),
    "`X-Robots-Tag": r(res.headers.get("x-robots-tag") === "noindex, nofollow" && /<meta name="robots" content="noindex, nofollow"/.test(html), `header: ${res.headers.get("x-robots-tag")}`),
    "Links:": r(!badLinks.length && !/<form/i.test(body), badLinks.length ? `live links: ${badLinks.slice(0, 3).join(", ")}` : "only #anchors and Unsplash credit links"),
    "`status` is `draft`": r(rec.status === "draft" && rec.expiresAt === addDays(rec.createdAt, 30), `${rec.status}, ${rec.createdAt} to ${rec.expiresAt}`),
    "No email address in the lead JSON": r(!/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(JSON.stringify(rec)), "no address in the record"),
    "Footer credit present": r(!stock.length || body.includes("Stock photos for illustration, not of"), stock.length ? "credit line found" : "no stock photos"),
    "Each photo's Unsplash page": r((rec.brand?.photoCredits ?? []).length === (rec.brand?.photos ?? []).length && (rec.brand?.photoCredits ?? []).every((c) => rec.sources.includes(c.photoPage ?? c.source)), "credits match photos, pages in sources"),
    "Desktop 1440 px and phone 390 px": r(shootOk, shootOk ? "shoot.mjs: no console errors, no sideways scroll" : "shoot.mjs reported a problem"),
    "Page title and description": r(rec.seo.title.includes("Concept preview") && rec.seo.description.includes(rec.business.name), rec.seo.title),
  };
}

/** Desktop and phone screenshots of the draft (repo shots/, outside Git). */
export function shoot(repo, slug, env) {
  return new Promise((resolve) => {
    execFile(process.execPath, [join(repo, "scripts", "shoot.mjs"), slug], { cwd: repo, env: { ...env, BASE_URL: DEV } }, (e, stdout) => {
      resolve({ ok: !e, log: String(stdout ?? "").trim(), files: ["desktop", "phone"].map((l) => join(repo, "shots", `${slug}-${l}.png`)).filter((f) => existsSync(f)) });
    });
  });
}
