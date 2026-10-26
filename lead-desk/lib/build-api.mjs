// Build preview routes. Saving writes leads/<slug>.json with status "draft" only; approval and
// publishing are separate (Approve screen), and only Kriv's clicks do them.
import { execFile } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { now, json, parse, log, rowToLead, tx } from "./db.mjs";
import { laterStatus } from "./leads.mjs";
import { SPEC, NICHE_INFO, listTemplates, readSources, prefill, formProblems, toRecord, schemaProblems, factsOf, writeLeadFile } from "./builder.mjs";
import { ensureDev, autoChecks, shoot, qaChecklist } from "./preview.mjs";
import { startJob, npmRoot } from "./jobs.mjs";
import * as unsplash from "./unsplash.mjs";

const bad = (msg, status = 400) => ({ httpStatus: status, body: { error: msg } });
const lead = (db, id) => rowToLead(db.prepare("SELECT * FROM leads WHERE id = ?").get(id));
const draftOf = (db, l) => (l?.slug ? db.prepare("SELECT * FROM drafts WHERE slug = ?").get(l.slug) : null);

/** QA list with the saved ticks: automatic ones from the last preview run, the rest Kriv's. */
export function qaState(repo, saved = []) {
  return qaChecklist(repo).map((q) => {
    const s = saved.find((x) => x.item === q.item);
    return { ...q, pass: s?.pass ?? false, auto: s?.auto ?? false, why: s?.why ?? null };
  });
}

function view(ctx, l) {
  const d = draftOf(ctx.db, l);
  const templates = listTemplates(ctx.repo);
  const rec = NICHE_INFO[l.niche]?.templates ?? [];
  const file = l.slug ? join(ctx.repo, "leads", `${l.slug}.json`) : null;
  const pageStatus = file && existsSync(file) ? parse(readFileSync(file, "utf8"), {}).status : null;
  return {
    lead: { id: l.id, name: l.name, niche: l.niche, town: l.town, state: l.state, website: l.website, website_status: l.website_status, status: l.status, slug: l.slug, email: l.email, looks_dated: l.looks_dated },
    spec: SPEC,
    templates: [...templates.filter((t) => rec.includes(t.id)), ...templates.filter((t) => !rec.includes(t.id))].map((t) => ({ ...t, recommended: rec.includes(t.id) })),
    form: parse(d?.form, null),
    editable: !pageStatus || pageStatus === "draft",
    pageStatus,
    qa: qaState(ctx.repo, parse(d?.qa, [])),
    screenshots: parse(d?.screenshots, []),
    pages: ctx.db.prepare("SELECT url, status, fetched_at FROM pages WHERE url IN (SELECT url FROM sources WHERE lead_id = ?) OR url LIKE ?").all(l.id, l.website ? `${l.website.replace(/\/$/, "")}%` : "-"),
    unsplash: { hasKey: !!unsplash.unsplashKey(ctx.repo), remaining: unsplash.rateLeft() },
  };
}

export const buildRoutes = [
  ["GET", /^\/api\/build\/(?<id>[^/]+)$/, (ctx) => {
    const l = lead(ctx.db, ctx.params.id);
    return l ? view(ctx, l) : bad("no such lead", 404);
  }],
  // Reads their site and listing now and returns a first draft of the form (not saved).
  ["POST", /^\/api\/build\/(?<id>[^/]+)\/prefill$/, async (ctx) => {
    const l = lead(ctx.db, ctx.params.id);
    if (!l) return bad("no such lead", 404);
    l.sources = ctx.db.prepare("SELECT url FROM sources WHERE lead_id = ?").all(l.id).map((r) => r.url);
    const pages = await readSources(ctx.db, l);
    return { form: prefill(l, pages, listTemplates(ctx.repo)), pages: pages.map(({ url, status, text }) => ({ url, status, text })) };
  }],
  // Text of one fetched page, so Kriv can read the facts next to the form.
  ["GET", /^\/api\/page$/, ({ db, query }) => db.prepare("SELECT url, status, text, fetched_at FROM pages WHERE url = ?").get(query.url) ?? bad("not fetched", 404)],
  ["POST", /^\/api\/build\/(?<id>[^/]+)\/save$/, (ctx) => {
    const l = lead(ctx.db, ctx.params.id);
    if (!l) return bad("no such lead", 404);
    if (["declined", "expired"].includes(l.status)) return bad(`This lead is ${l.status}.`);
    const form = ctx.body.form ?? {};
    const sameSlug = l.slug && l.slug === form.slug;
    const problems = formProblems(form, { repo: ctx.repo, existingSlugOk: sameSlug });
    const rec = toRecord(form);
    if (!problems.length) problems.push(...schemaProblems(rec));
    if (problems.length) return { saved: false, problems };
    let file;
    try { file = writeLeadFile(ctx.repo, rec); } catch (e) { return bad(e.message); }
    tx(ctx.db, () => {
      const t = now();
      ctx.db.prepare(`INSERT INTO drafts (slug, lead_id, template, facts, qa, screenshots, form, created_at, updated_at) VALUES (?, ?, ?, ?, '[]', '[]', ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET template = excluded.template, facts = excluded.facts, form = excluded.form, qa = '[]', updated_at = excluded.updated_at`)
        .run(rec.slug, l.id, rec.template, json(factsOf(form)), json(form), t, t);
      if (l.slug && l.slug !== rec.slug) ctx.db.prepare("DELETE FROM drafts WHERE slug = ?").run(l.slug);
      ctx.db.prepare("UPDATE leads SET slug = ?, status = ?, updated_at = ? WHERE id = ?").run(rec.slug, laterStatus(l.status, "draft"), t, l.id);
      log(ctx.db, l.id, "preview saved", { slug: rec.slug, template: rec.template, file });
    });
    // Any edit clears the QA ticks: the page has to be looked at again.
    return { saved: true, problems: [], slug: rec.slug };
  }],
  // Screenshots and the automatic QA checks, as a job (next dev may need a minute to start).
  ["POST", /^\/api\/build\/(?<id>[^/]+)\/preview$/, (ctx) => {
    const l = lead(ctx.db, ctx.params.id);
    if (!l?.slug) return bad("Save the preview first.");
    try {
      return startJob("preview", `Preview of ${l.name}`, null, async (job, say) => {
        const rec = JSON.parse(readFileSync(join(ctx.repo, "leads", `${l.slug}.json`), "utf8"));
        await ensureDev(ctx.repo, say);
        say("taking desktop and phone screenshots (scripts/shoot.mjs)...");
        const env = { ...process.env, NODE_PATH: process.env.NODE_PATH || (await npmRoot()) };
        const shot = await shoot(ctx.repo, l.slug, env);
        say(shot.log);
        const auto = await autoChecks(rec, { schemaOk: !schemaProblems(rec).length, shootOk: shot.ok });
        const prev = parse(draftOf(ctx.db, l)?.qa, []);
        const qa = qaChecklist(ctx.repo).map((q) => {
          const key = Object.keys(auto).find((k) => q.item.startsWith(k));
          if (key) return { item: q.item, pass: auto[key].pass, auto: true, why: auto[key].why };
          return prev.find((p) => p.item === q.item && !p.auto) ?? { item: q.item, pass: false, auto: false };
        });
        const screenshots = shot.files.map((f) => ({ label: /desktop/.test(f) ? "Desktop 1440 px" : "Phone 390 px", file: f }));
        ctx.db.prepare("UPDATE drafts SET qa = ?, screenshots = ?, updated_at = ? WHERE slug = ?").run(json(qa), json(screenshots), now(), l.slug);
        log(ctx.db, l.id, "preview checked", { auto: Object.fromEntries(Object.entries(auto).map(([k, v]) => [k, v.pass])) });
        const failed = qa.filter((q) => q.auto && !q.pass).length;
        say(failed ? `${failed} automatic check(s) failed` : "automatic checks passed; tick the rest after looking");
        return { failed };
      });
    } catch (e) { return bad(e.message); }
  }],
  ["POST", /^\/api\/build\/(?<id>[^/]+)\/qa$/, (ctx) => {
    const l = lead(ctx.db, ctx.params.id);
    const d = draftOf(ctx.db, l);
    if (!d) return bad("Save the preview first.");
    const qa = qaState(ctx.repo, parse(d.qa, []));
    const item = qa.find((q) => q.item === ctx.body.item);
    if (!item) return bad("unknown QA item");
    if (item.auto) return bad("That item is checked automatically; run the preview check again.");
    item.pass = !!ctx.body.pass;
    ctx.db.prepare("UPDATE drafts SET qa = ? WHERE slug = ?").run(json(qa.map(({ item: i, pass, auto, why }) => ({ item: i, pass, auto, why }))), d.slug);
    return { ok: true };
  }],

  ["GET", /^\/api\/unsplash$/, async (ctx) => {
    try { return await unsplash.search(ctx.repo, String(ctx.query.q ?? "").slice(0, 100), Number(ctx.query.page ?? 1)); } catch (e) { return bad(e.message); }
  }],
  // Kriv picked a photo: Unsplash's download tracking is called now, as its API terms require.
  ["POST", /^\/api\/unsplash\/use$/, async (ctx) => {
    try { return await unsplash.use(ctx.repo, String(ctx.body.id ?? "")); } catch (e) { return bad(e.message); }
  }],
  // Their own photos and logo (scripts/pick-site-photos.mjs list), as a job.
  ["POST", /^\/api\/build\/(?<id>[^/]+)\/site-photos$/, (ctx) => {
    const l = lead(ctx.db, ctx.params.id);
    const slug = ctx.body.slug;
    const pages = (ctx.body.pages ?? []).filter((u) => /^https?:\/\//.test(u)).slice(0, 5);
    if (!l || !slug || !pages.length) return bad("Needs the address (slug) and at least one of their pages.");
    try {
      return startJob("site-photos", `Photos on ${l.name}'s own site`, null, async (job, say) => {
        const env = { ...process.env, NODE_PATH: process.env.NODE_PATH || (await npmRoot()) };
        const out = await new Promise((res) => execFile(process.execPath, [join(ctx.repo, "scripts", "pick-site-photos.mjs"), "list", slug, ...pages], { cwd: ctx.repo, env }, (e, so, se) => res(`${so}\n${se}`)));
        say(out.trim().split("\n").slice(0, 3).join("\n"));
        return { slug };
      });
    } catch (e) { return bad(e.message); }
  }],
  ["GET", /^\/api\/site-photos\/(?<slug>[a-z0-9-]+)$/, ({ repo, params }) => {
    const f = join(repo, "shots", "site-photos", `${params.slug}.json`);
    return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : { logo: null, photos: [] };
  }],
];
