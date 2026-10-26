// A preparation review belongs to one exact page, email, set of sources and screenshots.
// Human QA ticks are not fabricated; this is a separate, server-generated review path.
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SLUG_PATTERN } from "../../src/lib/site-schema.ts";
import { now, parse } from "./db.mjs";

export function recordFile(ctx, lead) {
  if (!SLUG_PATTERN.test(lead.slug ?? "")) throw new Error("No valid draft address.");
  return join(ctx.repo, "leads", `${lead.slug}.json`);
}
export function preparationFingerprint(ctx, lead, report) {
  const rec = JSON.parse(readFileSync(recordFile(ctx, lead), "utf8"));
  rec.status = "draft"; // Kriv's approval changes status, not the content that was reviewed.
  const email = ctx.db.prepare("SELECT to_addr, subject, body FROM emails WHERE lead_id = ?").get(lead.id);
  const sources = report.sourceUrls.map((u) => ctx.db.prepare("SELECT url, status, text, fetched_at FROM pages WHERE url = ?").get(u) ?? null);
  const shots = report.screenshots.map((s) => createHash("sha256").update(readFileSync(s.file)).digest("hex"));
  return createHash("sha256").update(JSON.stringify({ rec, email, sources, shots })).digest("hex");
}
export function preparationReadiness(ctx, lead) {
  const p = ctx.db.prepare("SELECT * FROM preparations WHERE lead_id = ?").get(lead.id);
  if (!p) return { managed: false, ready: false, reason: "Awaiting automatic preparation." };
  if (p.state !== "ready") return { managed: true, ready: false, reason: parse(p.report, {}).reason ?? "Preparation is not finished." };
  const report = parse(p.report, {});
  try {
    if (!report.passed || !report.sourceUrls?.length || report.screenshots?.length !== 2 || (lead.status !== "approved" && p.updated_at.slice(0, 10) !== now().slice(0, 10))) throw new Error("This preparation needs a fresh review.");
    if (!existsSync(recordFile(ctx, lead))) throw new Error("The preview file is missing.");
    if (JSON.parse(readFileSync(recordFile(ctx, lead), "utf8")).expiresAt < now().slice(0, 10)) throw new Error("This preview has expired.");
    for (const u of report.sourceUrls) {
      const source = ctx.db.prepare("SELECT status, fetched_at FROM pages WHERE url = ?").get(u);
      if (source?.status !== 200 || (lead.status !== "approved" && source.fetched_at.slice(0, 10) !== now().slice(0, 10))) throw new Error("Source verification needs refreshing.");
    }
    if (preparationFingerprint(ctx, lead, report) !== p.fingerprint) throw new Error("The page, email, sources or screenshots changed and need another review.");
    return { managed: true, ready: true, reason: "Source and technical checks passed. Your approval is the final design and wording review.", report };
  } catch (e) { return { managed: true, ready: false, reason: e.message }; }
}
