// Publish: Kriv's confirm click commits one lead file to main and pushes, so Vercel redeploys
// production and kriv.agency/<slug> goes live. Done in the desk's own clean worktree of main
// (C:\Users\user\kriv-previews-publish), never in the working branch. Refuses when that copy has
// any other change, when main moved in a way that can't fast-forward, or when a check fails.
// Never force-pushes. The checks are the ones CLAUDE.md asks for before every commit.
import { execFile, exec } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { now, log, isOptedOut, parse } from "./db.mjs";
import { startJob } from "./jobs.mjs";
import { preparationReadiness } from "./preparation-state.mjs";
import { reviewBlockers, workflowOf, publicationVersion, contactBlocked, pendingPublication } from "./workflow-state.mjs";

export const WORKTREE = process.env.LEAD_DESK_PUBLISH_DIR || join(homedir(), "kriv-previews-publish");
export const CHECKS = [["lint"], ["typecheck"], ["test"], ["build"], ["test:smoke"]];

export function assertReviewedPublish(ctx, lead, p) {
  if (p.status === "expired") return;
  const currentLead = ctx.db.prepare("SELECT status, email FROM leads WHERE id = ?").get(lead.id);
  if (currentLead?.status !== "approved" || isOptedOut(ctx.db, currentLead.email) || contactBlocked(ctx.db, currentLead, ctx.db.prepare("SELECT * FROM emails WHERE lead_id = ?").get(lead.id))) throw new Error("Approval or contact permission changed; publishing stopped.");
  const w = workflowOf(ctx.db, lead.id);
  if (reviewBlockers(ctx, lead).length || (w && w.publication_version !== publicationVersion(ctx, lead))) throw new Error("The reviewed design, email or publication approval changed; publishing stopped.");
  const ready = preparationReadiness(ctx, { ...lead, ...currentLead });
  if (ready.managed && !ready.ready) throw new Error(ready.reason);
  const current = JSON.parse(readFileSync(join(ctx.repo, "leads", `${lead.slug}.json`), "utf8"));
  current.status = p.status;
  if (JSON.stringify(current, null, 2) + "\n" !== p.after) throw new Error("The publishing plan no longer matches the reviewed preview.");
}

// git runs directly; corepack is a .cmd on Windows, so it goes through the shell as one command
// line (its arguments are fixed words from this file, never input).
const run = (cmd, args, cwd, say) => new Promise((resolve, reject) => {
  const done = (e, stdout, stderr) => {
    if (e) return reject(new Error(`${cmd} ${args.join(" ")} failed: ${String(stderr || stdout).trim().split("\n").slice(-8).join("\n")}`));
    resolve(String(stdout).trim());
  };
  const opts = { cwd, maxBuffer: 1 << 26, env: process.env };
  const child = cmd === "git" ? execFile(cmd, args, opts, done) : exec([cmd, ...args].join(" "), opts, done);
  child.stdout?.on("data", (d) => String(d).split(/\r?\n/).filter((l) => /ok|FAIL|passed|failed|error|Compiled|✓/i.test(l)).forEach((l) => say?.(l.trim())));
});
const git = (args, cwd, say) => run("git", args, cwd, say);

/** The file as main has it now (null when it's new), and as the desk would publish it. */
export async function plan(repo, slug, status) {
  await git(["fetch", "origin", "main"], repo);
  const before = await git(["show", `origin/main:leads/${slug}.json`], repo).catch(() => null);
  const rec = JSON.parse(readFileSync(join(repo, "leads", `${slug}.json`), "utf8"));
  rec.status = status;
  const after = JSON.stringify(rec, null, 2) + "\n";
  const name = rec.business.name;
  return {
    slug, status, before, after,
    message: status === "expired"
      ? `Take down ${slug}: ${name} opted out\n\nStatus expired (the page stops showing), confirmed by Kriv on the Lead Desk.`
      : `Publish ${slug}: ${name}\n\nPreview page approved and publish confirmed by Kriv on the Lead Desk.`,
    checks: CHECKS.map((c) => `pnpm ${c.join(" ")}`),
    url: `https://kriv.agency/${slug}`,
  };
}

async function liveCheck(slug, name, wantLive, say, attempts = 40) {
  const banner = `Concept preview prepared by KRIV for ${name.replace(/&/g, "&amp;").replace(/'/g, "&#x27;")}`;
  for (let i = 0; i < attempts; i++) {
    if (i || attempts > 1) await new Promise((r) => setTimeout(r, 15000));
    try {
      const res = await fetch(`https://kriv.agency/${slug}?v=${Date.now()}`, { cache: "no-store" });
      const html = await res.text();
      const live = res.status === 200 && html.includes(banner) && res.headers.get("x-robots-tag") === "noindex, nofollow";
      const gone = !html.includes(banner);
      say(`kriv.agency/${slug}: ${res.status}${live ? ", banner and noindex present" : ""}`);
      if (wantLive ? live : gone) return true;
    } catch (e) { say(`kriv.agency/${slug}: ${e.message}`); }
  }
  return false;
}

/**
 * Starts the publish job. opts.dryRun stops before the commit (used by tests and to try it).
 * status: "approved" to publish, "expired" to take a page down after an opt-out.
 */
export function startPublish(ctx, lead, { status = "approved", dryRun = false } = {}) {
  if (status === "approved" && pendingPublication(ctx.db, lead.id)) throw new Error("Check the pending publication instead of publishing again.");
  const slug = lead.slug;
  return startJob("publish", `${dryRun ? "Dry run: " : ""}${status === "expired" ? "Take down" : "Publish"} ${lead.name}`, null, async (job, say) => {
    job.leadId = lead.id;
    const p = await plan(ctx.repo, slug, status);
    assertReviewedPublish(ctx, lead, p);
    if (!existsSync(WORKTREE)) {
      say(`creating the publishing copy of main at ${WORKTREE}...`);
      await git(["worktree", "add", "--detach", WORKTREE, "origin/main"], ctx.repo);
    }
    const dirty = await git(["status", "--porcelain"], WORKTREE);
    if (dirty) throw new Error(`The publishing copy has other changes, so nothing was published:\n${dirty}`);
    await git(["checkout", "--detach", "origin/main"], WORKTREE);
    say(`main is at ${(await git(["rev-parse", "--short", "HEAD"], WORKTREE))}`);
    if (!existsSync(join(WORKTREE, "node_modules"))) {
      say("installing packages in the publishing copy (first time only)...");
      await run("corepack", ["pnpm", "install", "--frozen-lockfile", "--prefer-offline"], WORKTREE, say);
    }
    writeFileSync(join(WORKTREE, "leads", `${slug}.json`), p.after);
    const changed = (await git(["status", "--porcelain"], WORKTREE)).split("\n").filter(Boolean);
    if (changed.length !== 1 || !changed[0].endsWith(`leads/${slug}.json`)) throw new Error(`Unexpected changes: ${changed.join(", ")}`);
    try {
      for (const c of CHECKS) { say(`pnpm ${c.join(" ")}...`); await run("corepack", ["pnpm", ...c], WORKTREE, say); }
    } catch (e) {
      await git(["checkout", "--", "."], WORKTREE);
      await git(["clean", "-fd", "leads"], WORKTREE);
      throw e;
    }
    if (dryRun) {
      await git(["checkout", "--", "."], WORKTREE);
      await git(["clean", "-fd", "leads"], WORKTREE);
      say("dry run: all checks passed; nothing committed or pushed");
      return { dryRun: true, ...p };
    }
    assertReviewedPublish(ctx, lead, p);
    await git(["add", `leads/${slug}.json`], WORKTREE);
    await git(["commit", "-m", p.message], WORKTREE);
    const sha = await git(["rev-parse", "--short", "HEAD"], WORKTREE);
    say(`committed ${sha}; pushing to main...`);
    assertReviewedPublish(ctx, lead, p);
    await git(["push", "origin", "HEAD:main"], WORKTREE); // a plain push: fails rather than overwrite if main moved
    log(ctx.db, lead.id, status === "expired" ? "taken down" : "published", { sha, slug, version: status === "expired" ? null : publicationVersion(ctx, lead), by: "Kriv (confirm click)" });
    // The working copy follows, so the branch and main agree on this file.
    writeFileSync(join(ctx.repo, "leads", `${slug}.json`), p.after);
    say("pushed. Waiting for Vercel to deploy (usually 1 to 3 minutes)...");
    const ok = await liveCheck(slug, JSON.parse(p.after).business.name, status !== "expired", say);
    if (ok && status !== "expired") ctx.db.prepare("UPDATE leads SET status = 'live', updated_at = ? WHERE id = ? AND status = 'approved'").run(now(), lead.id);
    if (ok) log(ctx.db, lead.id, status === "expired" ? "page gone (checked)" : "live (checked)", p.url);
    if (!ok) job.error = `Pushed ${sha}, but kriv.agency/${slug} didn't show the expected page within 10 minutes. Check the Vercel deployment.`;
    return { sha, url: p.url, verified: ok };
  });
}

/** Verification retry only: no Git, no commit, no push and no deployment. */
export async function verifyPublished(ctx, lead, check = liveCheck, say = () => {}) {
  const published = ctx.db.prepare("SELECT detail FROM history WHERE lead_id = ? AND action = 'published' ORDER BY id DESC LIMIT 1").get(lead.id);
  const detail = parse(published?.detail, {});
  const record = JSON.parse(readFileSync(join(ctx.repo, "leads", `${lead.slug}.json`), "utf8"));
  const p = { status: "approved", after: JSON.stringify({ ...record, status: "approved" }, null, 2) + "\n" };
  assertReviewedPublish(ctx, lead, p);
  if (detail.version && detail.version !== publicationVersion(ctx, lead)) throw new Error("The local preview changed after publication. Review it before continuing.");
  if (!await check(lead.slug, record.business.name, true, say, 1)) throw new Error("The published page is not verified yet. Nothing was republished; check the deployment and retry.");
  assertReviewedPublish(ctx, lead, p);
  ctx.db.prepare("UPDATE leads SET status = 'live', updated_at = ? WHERE id = ? AND status = 'approved'").run(now(), lead.id);
  log(ctx.db, lead.id, "live (checked)", `https://kriv.agency/${lead.slug}`);
  return { verified: true };
}
export function startLiveVerification(ctx, lead) {
  return startJob("verify-live", `Checking publication for ${lead.name}`, null, (job, say) => verifyPublished(ctx, lead, liveCheck, say));
}
