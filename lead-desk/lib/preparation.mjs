// Qualified lead -> source-matched facts + niche presets -> technical checks -> founder review.
// No paid AI. Never calls approve, publish, Gmail, LinkedIn or any model endpoint.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { now, json, rowToLead, isOptedOut, tx, slugify, log } from "./db.mjs";
import { readSources, listTemplates, formProblems, toRecord, schemaProblems, factsOf, writeLeadFile } from "./builder.mjs";
import { ensureDev, shoot, autoChecks } from "./preview.mjs";
import { npmRoot } from "./jobs.mjs";
import { emailsIn } from "../../scripts/site-flags.mjs";
import { preparationFingerprint, recordFile, recordFingerprint } from "./preparation-state.mjs";
import { openBlanks, fullBody } from "./compose.mjs";
import { presetForm, presetEmail } from "./offer-presets.mjs";
import * as unsplash from "./unsplash.mjs";
import { NICHE } from "../public/niches.js";
import { reviewPaused } from "./workflow-state.mjs";

async function choosePhotos(ctx, lead) {
  const found = await unsplash.search(ctx.repo, NICHE[lead.niche]?.photo ?? "tools workspace");
  const photos = [];
  for (const p of found.results.filter((p) => !p.warn).slice(0, 2)) photos.push(await unsplash.use(ctx.repo, p.id));
  if (!photos.length) throw new Error("No suitable credited photos found. Held for investigation.");
  return photos;
}
export async function prepareLead(ctx, id, deps = {}, cancelled = () => false) {
  const l = rowToLead(ctx.db.prepare("SELECT * FROM leads WHERE id = ?").get(id));
  if (!l || !["found", "draft"].includes(l.status) || l.bucket !== "qualified") throw new Error("Only a qualified, unapproved lead can be prepared.");
  if (reviewPaused(ctx.db, id)) throw new Error("This preview has a saved review decision. Changes require a separate, authorized editing step.");
  if (!l.email || isOptedOut(ctx.db, l.email)) throw new Error("No contactable business mailbox.");
  const originalFile = l.slug ? recordFile(ctx, l) : null;
  const original = originalFile && existsSync(originalFile) ? readFileSync(originalFile, "utf8") : null;
  const initialSlug = l.slug;
  const previousMail = ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(id);
  const mailVersion = json(previousMail);
  const prior = ctx.db.prepare("SELECT * FROM preparations WHERE lead_id = ?").get(id);
  const revision = prior?.revision ?? "";
  if (previousMail?.status === "sent") throw new Error("Sent outreach cannot be regenerated.");
  const checkCurrent = () => {
    if (cancelled()) throw new Error("Preparation cancelled.");
    const current = ctx.db.prepare("SELECT status, email, slug FROM leads WHERE id = ?").get(id);
    if (!current || reviewPaused(ctx.db, id) || !["found", "draft"].includes(current.status) || current.slug !== initialSlug || current.email !== l.email || isOptedOut(ctx.db, current.email)) throw new Error("Lead decision changed during preparation.");
    if (originalFile && readFileSync(originalFile, "utf8") !== original) throw new Error("Draft was edited during preparation; those edits were preserved.");
    if (json(ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(id)) !== mailVersion) throw new Error("Email was edited during preparation; those edits were preserved.");
  };
  ctx.db.prepare("INSERT INTO preparations (lead_id, state, attempts, updated_at) VALUES (?, 'preparing', 1, ?) ON CONFLICT(lead_id) DO UPDATE SET state = 'preparing', fingerprint = NULL, attempts = attempts + 1, updated_at = excluded.updated_at").run(id, now());
  try {
    l.sources = ctx.db.prepare("SELECT url FROM sources WHERE lead_id = ?").all(id).map((s) => s.url);
    const pages = (await (deps.readSources ?? readSources)(ctx.db, l, { refresh: true })).filter((p) => p.status === 200 && p.text);
    if (!pages.length) throw new Error("Sources could not be read. Held for investigation.");
    const published = pages.flatMap((p) => emailsIn(p.text, [...String(p.html ?? "").matchAll(/href=["'](mailto:[^"']+)["']/gi)].map((m) => ({ href: m[1] }))));
    if (!published.includes(l.email.toLowerCase())) throw new Error("The contact email could not be confirmed on current source pages.");
    const oldRecord = original ? JSON.parse(original) : null;
    const form = (deps.form ?? presetForm)(l, pages, (deps.templates ?? listTemplates)(ctx.repo), { revision, attempt: prior?.attempts ?? 0 });
    // A daily refresh keeps the design already prepared; only a revision request changes it.
    if (oldRecord?.template && !revision) form.template = oldRecord.template;
    form.slug = l.slug ?? form.slug;
    if (!l.slug && existsSync(join(ctx.repo, "leads", `${form.slug}.json`))) form.slug = `${form.slug.slice(0, 60)}-${randomUUID().slice(0, 8)}`;
    form.photos = oldRecord?.brand?.photos?.length ? oldRecord.brand.photos.map((url, i) => ({ url, credit: oldRecord.brand.photoCredits[i] })) : await (deps.photos ?? choosePhotos)(ctx, l);
    // An initial offer may omit an unverified town/category instead of inventing it. The
    // advanced editor keeps its existing manual requirements; this path explicitly hides them.
    const problems = formProblems(form, { repo: ctx.repo, existingSlugOk: !!original }).filter((p) => !["Town: required", "Category: required"].includes(p));
    if (problems.length) throw new Error(problems.join(" "));
    const rec = toRecord(form);
    rec.business.address.city ??= "";
    rec.business.category ??= "";
    if (!form.f.city?.v) rec.seo.description = `Concept preview of a website for ${rec.business.name}, prepared by KRIV.`.slice(0, 160);
    if (schemaProblems(rec).length) throw new Error(`Draft is invalid: ${schemaProblems(rec).join(" ")}`);
    if (!rec.brand.photos.length) throw new Error("Preview has no suitable photos yet.");
    const mail = previousMail && !revision ? previousMail : (deps.email ?? presetEmail)(l, rec, { revision, attempt: prior?.attempts ?? 0 });
    if (!mail.subject?.trim() || !mail.body?.trim() || openBlanks(mail.subject, mail.body).length || mail.to_addr !== l.email || !mail.body.includes(`https://kriv.agency/${rec.slug}`)) throw new Error("Email is incomplete or does not match the preview.");
    checkCurrent();
    const emailsDir = join(ctx.leadsDir, "emails"); mkdirSync(emailsDir, { recursive: true });
    const emailFile = join(emailsDir, `${rec.slug}.txt`);
    if (original || existsSync(emailFile)) {
      const dir = join(ctx.leadsDir, "revisions"); mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${slugify(id)}-${randomUUID()}.json`), json({ record: oldRecord, email: previousMail, emailFile: existsSync(emailFile) ? readFileSync(emailFile, "utf8") : null, form: ctx.db.prepare("SELECT form FROM drafts WHERE slug = ?").get(l.slug ?? "")?.form, request: revision || "Initial preset preparation", at: now() }), { flag: "wx" });
    }
    writeLeadFile(ctx.repo, rec);
    if (rec.expiresAt < now().slice(0, 10)) throw new Error("This preview has expired; it cannot be offered without a new draft.");
    l.slug = rec.slug;
    tx(ctx.db, () => {
      ctx.db.prepare("INSERT INTO drafts (slug, lead_id, template, facts, created_at, updated_at, form) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET template = excluded.template, facts = excluded.facts, form = excluded.form, qa = '[]', updated_at = excluded.updated_at")
        .run(rec.slug, id, rec.template, json(factsOf(form)), now(), now(), json(form));
      ctx.db.prepare("UPDATE leads SET slug = ?, status = 'draft', updated_at = ? WHERE id = ?").run(rec.slug, now(), id);
      ctx.db.prepare("INSERT INTO emails (lead_id, to_addr, subject, body, status, updated_at) VALUES (?, ?, ?, ?, 'draft', ?) ON CONFLICT(lead_id) DO UPDATE SET to_addr = excluded.to_addr, subject = excluded.subject, body = excluded.body, updated_at = excluded.updated_at")
        .run(id, l.email, mail.subject, mail.body, now());
    });
    if (!previousMail || revision) writeFileSync(emailFile, `To: ${l.email}\nSubject: ${mail.subject}\n\n${fullBody(mail.body)}\n`);
    const written = readFileSync(recordFile(ctx, l), "utf8");
    const mailWritten = json(ctx.db.prepare("SELECT to_addr, subject, body FROM emails WHERE lead_id = ?").get(id));
    await (deps.ensureDev ?? ensureDev)(ctx.repo);
    if (cancelled()) throw new Error("Preparation cancelled.");
    const shot = await (deps.shoot ?? shoot)(ctx.repo, rec.slug, { ...process.env, NODE_PATH: process.env.NODE_PATH || await npmRoot() });
    if (!shot.ok || shot.files.length !== 2) throw new Error("Desktop or phone preview check failed.");
    const screenshots = shot.files.map((file, i) => ({ file, label: i ? "Phone" : "Desktop" }));
    const auto = await (deps.autoChecks ?? autoChecks)(rec, { schemaOk: true, shootOk: true });
    if (Object.keys(auto).length !== 10 || Object.values(auto).some((v) => !v.pass)) throw new Error("A technical preview check failed.");
    if (cancelled() || readFileSync(recordFile(ctx, l), "utf8") !== written || json(ctx.db.prepare("SELECT to_addr, subject, body FROM emails WHERE lead_id = ?").get(id)) !== mailWritten) throw new Error("Content changed during checks; preparation must run again.");
    const current = ctx.db.prepare("SELECT status FROM leads WHERE id = ?").get(id);
    if (current?.status !== "draft" || isOptedOut(ctx.db, l.email)) throw new Error("Lead decision changed during preparation.");
    const report = { sourceUrls: pages.map((p) => p.url), screenshots, passed: true, recordFingerprint: recordFingerprint(rec),
      summary: `${rec.template}: a reusable concept offer with source-matched business details${form.f.city?.v ? "" : "; unverified location omitted"}. Technical checks passed. Your approval is the final design and wording review.`,
      checkedAt: now(), checks: Object.keys(auto), reviewer: "Source matching + technical checks; founder reviews final appearance" };
    const fingerprint = preparationFingerprint(ctx, l, report);
    ctx.db.prepare("UPDATE drafts SET screenshots = ?, updated_at = ? WHERE slug = ?").run(json(screenshots), now(), rec.slug);
    ctx.db.prepare("UPDATE preparations SET state = 'ready', report = ?, fingerprint = ?, revision = NULL, updated_at = ? WHERE lead_id = ?").run(json(report), fingerprint, now(), id);
    log(ctx.db, id, "preparation ready", { slug: rec.slug, mode: "presets; no paid AI" });
    return report;
  } catch (e) {
    ctx.db.prepare("UPDATE preparations SET state = 'held', report = ?, fingerprint = NULL, updated_at = ? WHERE lead_id = ?").run(json({ reason: e.message }), now(), id);
    log(ctx.db, id, "preparation held", { reason: e.message });
    throw e;
  }
}
