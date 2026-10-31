// Find leads and Check sites: start, watch and cancel the one running job, and read results.
import { parse } from "./db.mjs";
import { plain, isExcluded } from "../../scripts/finder/rules.mjs";
import { HOTFROG_CATS } from "../../scripts/finder/sources.mjs";
import { jobStatus, cancelJob, startCheck, startFind, BATCH } from "./jobs.mjs";

const bad = (msg, status = 400) => ({ httpStatus: status, body: { error: msg } });
const attempt = (fn) => { try { return fn(); } catch (e) { return bad(e.message); } };

// Towns from docs/LEAD-FINDER.md, as Hotfrog writes them. Any other "town-st" can be typed in.
export const TOWNS = {
  TX: ["new-braunfels", "seguin", "boerne", "schertz", "universal-city", "converse", "helotes", "live-oak", "san-antonio", "waco", "tyler", "killeen", "temple"],
  FL: ["ocala", "lakeland", "port-st-lucie", "sebring", "panama-city"],
  UT: ["ogden", "provo", "orem", "logan", "st-george", "cedar-city"],
};

export const workRoutes = [
  ["GET", /^\/api\/job$/, () => jobStatus() ?? {}],
  ["POST", /^\/api\/job\/cancel$/, () => cancelJob() ?? {}],
  ["GET", /^\/api\/find\/options$/, ({ db }) => ({
    towns: TOWNS, niches: Object.keys(HOTFROG_CATS),
    recent: db.prepare("SELECT at, detail FROM history WHERE action = 'find' ORDER BY at DESC LIMIT 15").all().map((h) => ({ at: h.at, ...parse(h.detail, {}) })),
  })],
  ["POST", /^\/api\/find$/, (ctx) => attempt(() => startFind(ctx, ctx.body))],
  // Websites found but never checked, newest first, filtered by state and niche.
  ["GET", /^\/api\/check\/queue$/, ({ db, query }) => {
    const rows = db.prepare("SELECT c.key, c.data, c.found_at FROM candidates c LEFT JOIN checks k ON k.host = c.key WHERE k.host IS NULL ORDER BY c.found_at DESC").all()
      .map((r) => ({ key: r.key, foundAt: r.found_at, ...parse(r.data, {}) }))
      .filter((c) => c.website && !isExcluded(c.name ?? "", c.website) && (!query.state || c.state === query.state) && (!query.niche || c.niche === query.niche));
    return { batch: BATCH, rows: rows.map(({ key, name, state, town, niche, website, foundAt }) => ({ key, name, state, town, niche, website, foundAt })) };
  }],
  ["POST", /^\/api\/check$/, (ctx) => attempt(() => startCheck(ctx, ctx.body.urls ?? []))],
  ["GET", /^\/api\/check\/results$/, ({ db, query }) => db.prepare(`SELECT k.host, k.data, k.checked_at, k.shot, l.id AS lead_id, l.name, l.bucket, l.status, l.email
      FROM checks k LEFT JOIN leads l ON l.key = k.host WHERE k.checked_at >= ? ORDER BY k.checked_at DESC LIMIT 400`).all(query.since ?? new Date(Date.now() - 864e5).toISOString())
    .map((r) => {
      const d = parse(r.data, {});
      return { host: r.host, url: d.finalUrl ?? d.url, checkedAt: r.checked_at, shot: r.shot, leadId: r.lead_id, name: r.name ?? d.title, bucket: r.bucket, status: r.status, email: r.email,
        weak: d.weak, notChecked: d.flags?.includes("not-checked"), problems: (d.flags ?? []).filter((f) => f !== "not-checked").map(plain), why: d.error ?? (d.flags?.includes("not-checked") ? `${d.status ?? ""} ${d.title ?? ""}`.trim() : null) };
    })],
];
