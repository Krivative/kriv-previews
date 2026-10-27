import { json, parse, rowToLead, log } from "./db.mjs";
import { preparationReadiness } from "./preparation-state.mjs";
import { automationStatus, automationTick, DEFAULT_SEARCH } from "./automation.mjs";
import { approveBlockers } from "./approve-api.mjs";
import { fullBody } from "./compose.mjs";
import { REVISIONS } from "./offer-presets.mjs";
import { jobStatus } from "./jobs.mjs";
import { decideReview } from "./workflow-api.mjs";

const bad = (error, httpStatus = 400) => ({ httpStatus, body: { error } });
export const inboxRoutes = [
  ["GET", /^\/api\/inbox$/, (ctx) => ({
    automation: automationStatus(ctx),
    job: jobStatus(),
    revisions: REVISIONS,
    rows: ctx.db.prepare("SELECT * FROM leads WHERE status IN ('found', 'draft', 'approved', 'live', 'sent', 'replied') AND (bucket = 'qualified' OR slug IS NOT NULL) ORDER BY updated_at DESC").all().map(rowToLead).map((l) => {
      const p = ctx.db.prepare("SELECT * FROM preparations WHERE lead_id = ?").get(l.id);
      const d = ctx.db.prepare("SELECT screenshots FROM drafts WHERE slug = ?").get(l.slug);
      const mail = ctx.db.prepare("SELECT subject, body, status FROM emails WHERE lead_id = ?").get(l.id);
      const r = preparationReadiness(ctx, l);
      return { id: l.id, name: l.name, town: l.town, state: l.state, niche: l.niche, slug: l.slug, status: l.status,
        preparation: r.ready ? "ready" : p?.state === "ready" ? "stale" : p?.state ?? "waiting",
        reason: r.reason, summary: r.report?.summary ?? "", revision: p?.revision ?? "",
        sources: r.report?.sourceUrls ?? [],
        screenshots: r.report?.screenshots ?? parse(d?.screenshots, []),
        email: mail ? { subject: mail.subject, body: fullBody(mail.body), status: mail.status } : null,
        blockers: l.status === "draft" ? approveBlockers(ctx, l) : [],
        ready: l.status === "draft" && r.ready && !approveBlockers(ctx, l).length };
    }),
  })],
  ["POST", /^\/api\/inbox\/settings$/, (ctx) => {
    try {
      if (ctx.body.search) {
        const s = ctx.body.search;
        if (s.source !== "hotfrog" || !Array.isArray(s.towns) || !s.towns.length || s.towns.length > 3 || s.towns.some((t) => !/^[a-z-]+-(tx|fl|ut)$/.test(t))) return bad("Use one to three Texas, Florida or Utah towns, such as ocala-fl.");
        ctx.db.prepare("INSERT INTO settings (key, value) VALUES ('automation_search', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(json({ ...DEFAULT_SEARCH, towns: s.towns }));
      }
      if (ctx.body.enabled === true) {
        ctx.db.prepare("INSERT INTO settings (key, value) VALUES ('automation_enabled', '1') ON CONFLICT(key) DO UPDATE SET value = '1'").run();
      } else if (ctx.body.enabled === false) {
        ctx.db.prepare("INSERT INTO settings (key, value) VALUES ('automation_enabled', '0') ON CONFLICT(key) DO UPDATE SET value = '0'").run();
      }
      log(ctx.db, null, "automation settings", { enabled: ctx.body.enabled ?? null, mode: "no paid AI" });
      return automationStatus(ctx);
    } catch (e) { return bad(e.message); }
  }],
  ["POST", /^\/api\/inbox\/prepare$/, (ctx) => {
    if (!automationStatus(ctx).running) return bad(automationStatus(ctx).reason);
    try { automationTick(ctx); return { ok: true }; } catch (e) { return bad(e.message); }
  }],
  ["POST", /^\/api\/inbox\/(?<id>[^/]+)\/revision$/, (ctx) => {
    // Kept as a safe compatibility alias. Old tabs must reload to supply version tokens.
    return decideReview({ ...ctx, body: { ...ctx.body, decision: "revision", feedback: ctx.body.feedback ?? ctx.body.request } });
  }],
];
