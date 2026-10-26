// Routes for the optional AI help (lead-desk/lib/ai.mjs). Every call is logged with its cost.
import { now, parse, log, rowToLead } from "./db.mjs";
import { readSources } from "./builder.mjs";
import { aiKey, aiEnabled, aiPrefill, aiSuggest, MODEL, PRICE } from "./ai.mjs";

const bad = (msg, status = 400) => ({ httpStatus: status, body: { error: msg } });
const lead = (db, id) => rowToLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(id));
const spent = (db) => db.prepare("SELECT detail FROM history WHERE action = 'ai'").all().reduce((s, h) => s + (parse(h.detail, {}).cost ?? 0), 0);
const attempt = async (fn) => { try { return await fn(); } catch (e) { return bad(e.message); } };

export const aiRoutes = [
  ["GET", /^\/api\/ai$/, ({ db, repo }) => ({ available: !!aiKey(repo), enabled: aiEnabled(db), model: MODEL, price: PRICE, spent: spent(db) })],
  ["POST", /^\/api\/ai$/, ({ db, repo, body }) => {
    if (!aiKey(repo)) return bad("No ANTHROPIC_API_KEY in .env.local.");
    db.prepare("INSERT INTO settings (key, value) VALUES ('ai_enabled', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(body.enabled ? "1" : "0");
    log(db, null, "ai switch", { enabled: !!body.enabled, at: now() });
    return { enabled: !!body.enabled };
  }],
  ["POST", /^\/api\/build\/(?<id>[^/]+)\/ai-prefill$/, (ctx) => attempt(async () => {
    const l = lead(ctx.db, ctx.params.id);
    if (!l) return bad("no such lead", 404);
    l.sources = ctx.db.prepare("SELECT url FROM sources WHERE lead_id = ?").all(l.id).map((r) => r.url);
    const r = await aiPrefill(ctx.repo, ctx.db, l, await readSources(ctx.db, l));
    log(ctx.db, l.id, "ai", { what: "prefill", model: MODEL, input: r.usage.input_tokens, output: r.usage.output_tokens, cost: r.cost });
    return r;
  })],
  ["POST", /^\/api\/ai\/suggest$/, (ctx) => attempt(async () => {
    const l = lead(ctx.db, ctx.body.leadId);
    if (!l) return bad("no such lead", 404);
    const facts = [l.website_status, ...(l.looks_dated ?? [])].filter(Boolean).join("; ");
    const r = await aiSuggest(ctx.repo, ctx.db, { kind: ctx.body.kind === "linkedin" ? "linkedin" : "email", lead: l, draft: String(ctx.body.draft ?? ""), facts });
    log(ctx.db, l.id, "ai", { what: `suggest ${ctx.body.kind}`, model: MODEL, input: r.usage.input_tokens, output: r.usage.output_tokens, cost: r.cost });
    return r;
  })],
];
