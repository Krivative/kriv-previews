// Long-running work, one job at a time (the machine runs out of memory with parallel Chromium):
// site checks in batches of 20 and directory collection with pauses between requests.
import { execFile, exec } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { host, isExcluded, fromHotfrog, fromChamber, plain } from "../../scripts/finder/rules.mjs";
import { hotfrog, chamber } from "../../scripts/finder/sources.mjs";
import { now, json, parse, log, isOptedOut, tx } from "./db.mjs";
import { rerunRules } from "./pipeline.mjs";

export const BATCH = 20;
let current = null;
const stamp = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

export const jobStatus = () => current && { ...current, log: current.log.slice(-60) };
export function cancelJob() {
  if (current?.status === "running") { current.cancelled = true; current.child?.kill(); }
  return jobStatus();
}

export function startJob(kind, label, total, run) {
  if (current?.status === "running") throw new Error(`Busy: ${current.label}. Wait for it to finish or cancel it.`);
  const job = { id: stamp(), kind, label, total, done: 0, log: [], status: "running", startedAt: now(), result: null, cancelled: false };
  current = job;
  const say = (line) => { job.log.push(`${new Date().toLocaleTimeString()} ${line}`); };
  run(job, say).then((result) => { job.result = result; job.status = job.cancelled ? "cancelled" : "done"; },
    (e) => { say(`failed: ${e.message}`); job.status = "failed"; job.error = e.message; })
    .finally(() => { job.finishedAt = now(); job.child = null; });
  return jobStatus();
}

let globalModules;
export const npmRoot = () => (globalModules ??= new Promise((res) => exec("npm root -g", (e, out) => res(e ? "" : out.trim()))));

/** Saves check-site.mjs results, refreshes matching leads and re-runs the rules for them. */
export async function saveChecks(db, results) {
  const hosts = [];
  tx(db, () => {
    for (const r of results) {
      const h = host(r.url);
      if (!h) continue;
      hosts.push(h);
      db.prepare("INSERT INTO checks (host, data, checked_at, shot) VALUES (?, ?, ?, ?) ON CONFLICT(host) DO UPDATE SET data = excluded.data, checked_at = excluded.checked_at, shot = COALESCE(excluded.shot, checks.shot)")
        .run(h, json(r), r.checkedAt, r.shot ?? null);
      // Leads with no listing behind them (imported ones) still get the fresh verdict.
      const status = r.flags.length ? r.flags.map(plain).join("; ") : "modern";
      for (const l of db.prepare("SELECT id FROM leads WHERE key = ?").all(h)) {
        db.prepare("UPDATE leads SET flags = ?, website_status = ?, checked_at = ?, updated_at = ? WHERE id = ?").run(json(r.flags), status, r.checkedAt, now(), l.id);
        log(db, l.id, "site checked", { flags: r.flags, weak: r.weak });
      }
    }
  });
  const keys = db.prepare(`SELECT key FROM candidates WHERE key IN (${hosts.map(() => "?").join(",") || "''"})`).all(...hosts).map((r) => r.key);
  return keys.length ? rerunRules(db, { keys }) : null;
}

/** check-site.mjs over the URLs, 20 at a time, each batch in the foreground of its own process. */
export function startCheck(ctx, urls) {
  const list = [...new Set(urls.map((u) => String(u).trim()).filter(Boolean))];
  if (!list.length) throw new Error("No websites to check.");
  return startJob("check", `Checking ${list.length} website${list.length > 1 ? "s" : ""}`, list.length, async (job, say) => {
    const shotsDir = join(ctx.leadsDir, "shots", "sites");
    const batchDir = join(ctx.leadsDir, "finder", "batches");
    mkdirSync(batchDir, { recursive: true });
    const env = { ...process.env, NODE_PATH: process.env.NODE_PATH || (await npmRoot()) };
    const all = [];
    for (let i = 0; i < list.length && !job.cancelled; i += BATCH) {
      const chunk = list.slice(i, i + BATCH);
      say(`batch ${i / BATCH + 1} of ${Math.ceil(list.length / BATCH)}: ${chunk.length} sites`);
      const out = await new Promise((resolve, reject) => {
        const child = execFile(process.execPath, [join(ctx.repo, "scripts", "check-site.mjs"), "--shots", shotsDir, ...chunk], { cwd: ctx.repo, env, maxBuffer: 1 << 28 }, (e, stdout) => {
          if (job.cancelled) return resolve("[]");
          if (e && !stdout) return reject(e);
          resolve(stdout);
        });
        job.child = child;
        child.stderr.on("data", (d) => String(d).split(/\r?\n/).filter(Boolean).forEach((line) => { say(line); if (/^(WEAK|SKIP|ERR |ok  )/.test(line)) job.done++; }));
      });
      const results = parse(out, []);
      writeFileSync(join(batchDir, `${job.id}-${i / BATCH}.json`), JSON.stringify(results, null, 2));
      const rules = await saveChecks(ctx.db, results);
      all.push(...results);
      if (rules) say(`rules: ${rules.qualified} qualified, ${rules.toReview} to visual review, ${rules.near} near misses so far in this batch`);
    }
    return { checked: all.length, weak: all.filter((r) => r.weak).length, notChecked: all.filter((r) => r.flags.includes("not-checked")).length, since: job.startedAt };
  });
}

/** Adds a listing to the candidates table, merging with an earlier find of the same business. */
export function addCandidate(db, c) {
  const key = c.website ? host(c.website) : c.listingUrl;
  if (!key) return null;
  const prev = parse(db.prepare("SELECT data FROM candidates WHERE key = ?").get(key)?.data);
  const merged = prev
    ? { ...prev, name: prev.name ?? c.name, address: prev.address ?? c.address, phone: prev.phone ?? c.phone, state: prev.state ?? c.state, town: prev.town ?? c.town,
        emailsListing: [...new Set([...(prev.emailsListing ?? []), ...(c.emailsListing ?? [])])], sources: [...new Set([...(prev.sources ?? []), ...(c.sources ?? [])])] }
    : { ...c, emailsListing: c.emailsListing ?? [], sources: [...(c.sources ?? [])] };
  db.prepare("INSERT INTO candidates (key, data, found_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data").run(key, json(merged), now());
  return { key, isNew: !prev };
}

/**
 * Directory listings -> candidates. Skips chains, franchises and specialists, and anyone on the
 * do-not-contact list (by email or website domain); dedupes against everything already found.
 */
export function startFind(ctx, { source, towns = [], niches = [], lists = [] }) {
  if (source === "hotfrog" && !towns.length) throw new Error("Pick at least one town.");
  if (source === "chamber" && !lists.every((u) => /^https:\/\/[^/]+\/list\/?/.test(u))) throw new Error("Chamber directories must be ChamberMaster \".../list/\" addresses.");
  const label = source === "hotfrog" ? `Hotfrog: ${towns.join(", ")} (${niches.join(", ") || "all niches"})` : `Chamber directories: ${lists.length}`;
  return startJob("find", label, null, async (job, say) => {
    // A 403/429/503 is a bot wall or rate limit: counted and reported, never worked around.
    let blocked = 0;
    const logLine = (line) => { if (/^(403|429|503) /.test(line)) { blocked++; say(`${line}  (blocked: verification page or rate limit)`); } else say(line); };
    const opts = { log: logLine, cancelled: () => job.cancelled, niches: niches.length ? niches : undefined };
    const raw = source === "hotfrog" ? await hotfrog(towns, opts) : await chamber(lists, { ...opts, niches: niches.length ? niches : null });
    const dir = join(ctx.leadsDir, "finder");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${source}-${job.id}.json`), JSON.stringify(raw, null, 2));
    const counts = { listings: raw.length, new: 0, known: 0, chains: 0, doNotContact: 0, toCheck: 0 };
    const newKeys = [];
    tx(ctx.db, () => {
      for (const r of raw) {
        const c = source === "hotfrog" ? fromHotfrog(r) : fromChamber(r);
        if (isExcluded(c.name ?? "", c.website ?? "")) { counts.chains++; continue; }
        const site = c.website ? host(c.website) : null;
        if ((c.emailsListing ?? []).some((e) => isOptedOut(ctx.db, e)) || (site && isOptedOut(ctx.db, `x@${site}`))) { counts.doNotContact++; continue; }
        const known = ctx.db.prepare("SELECT 1 FROM leads WHERE key = ? OR (phone_digits IS NOT NULL AND phone_digits = ?)").get(site ?? c.listingUrl, String(c.phone ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, ""));
        const added = addCandidate(ctx.db, { ...c, foundBy: "lead desk" });
        if (!added) continue;
        if (known || !added.isNew) counts.known++;
        else { counts.new++; newKeys.push(added.key); }
        if (site && !ctx.db.prepare("SELECT 1 FROM checks WHERE host = ?").get(site)) counts.toCheck++;
      }
      log(ctx.db, null, "find", { label, ...counts, blocked });
    });
    // Listings without a website can be judged now; the rest wait for the site check.
    const rules = newKeys.length ? await rerunRules(ctx.db, { keys: newKeys }) : null;
    say(`done: ${counts.listings} listings, ${counts.new} new, ${counts.known} already known, ${counts.chains} chains or specialists skipped, ${counts.doNotContact} on the do-not-contact list, ${counts.toCheck} websites to check`);
    if (blocked) {
      job.error = `${blocked} request${blocked > 1 ? "s were" : " was"} blocked by ${source === "hotfrog" ? "Hotfrog" : "the directory"} (a verification page or rate limit). The desk doesn't get around blocks: try again another day or use another source.`;
      say(job.error);
    }
    return { ...counts, blocked, rules };
  });
}

/** Desktop and phone screenshots for the visual review, 20 sites per Chromium run. */
export function startShots(ctx, urls) {
  const list = [...new Set(urls.filter(Boolean))];
  if (!list.length) throw new Error("No websites to screenshot.");
  return startJob("shots", `Screenshots for the visual review: ${list.length} site${list.length > 1 ? "s" : ""}`, list.length, async (job, say) => {
    const env = { ...process.env, NODE_PATH: process.env.NODE_PATH || (await npmRoot()) };
    for (let i = 0; i < list.length && !job.cancelled; i += BATCH) {
      const chunk = list.slice(i, i + BATCH);
      await new Promise((resolve) => {
        const child = execFile(process.execPath, [join(ctx.repo, "lead-desk", "site-shots.mjs"), join(ctx.leadsDir, "shots", "review"), ...chunk], { cwd: ctx.repo, env }, () => resolve());
        job.child = child;
        child.stderr.on("data", (d) => String(d).split(/\r?\n/).filter(Boolean).forEach((line) => { say(line); if (/^ok {3}phone|^ERR {2}phone/.test(line)) job.done++; }));
      });
    }
    return { shot: job.done };
  });
}
