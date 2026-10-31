// Unattended run for Windows Task Scheduler (Kriv authorized 2026-11-01): the same automatic
// finding, checking and preset preparation the open Desk runs, then exit. It never approves,
// publishes, sends email or touches LinkedIn: automationTick has no such steps.
// Skips when automatic building is paused, when the Desk is open (its own worker runs) or
// when another unattended run holds the lock. Stops when idle or after --minutes (default 50).
//   node lead-desk/worker.mjs [--minutes 50] [--check-only]
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openDb, log } from "./lib/db.mjs";
import { automationStatus, automationTick } from "./lib/automation.mjs";
import { jobStatus } from "./lib/jobs.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const minutes = Math.min(Math.max(Number(arg("--minutes", 50)) || 50, 1), 120);
const leadsDir = process.env.KRIV_LEADS_DIR || join(homedir(), "kriv-leads");
const ctx = { repo: resolve(here, ".."), leadsDir, reportsDir: join(homedir(), "kriv-reports") };
const lockFile = join(leadsDir, "unattended.lock");
const say = (m) => console.log(`${new Date().toISOString()} ${m}`);

async function deskOpen(port = Number(process.env.LEAD_DESK_PORT || 4321)) {
  try { const r = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2000) }); return r.status > 0; } catch { return false; }
}
function alive(pid) { try { process.kill(pid, 0); return true; } catch { return false; } }

export async function preflight(db) {
  if (!automationStatus({ db }).running) return "Automatic building is paused in the Desk.";
  if (await deskOpen()) return "The Desk is open; its own worker is running.";
  if (existsSync(lockFile)) {
    const pid = Number(readFileSync(lockFile, "utf8"));
    if (pid && alive(pid)) return `Another unattended run (process ${pid}) is active.`;
  }
  return "";
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  mkdirSync(leadsDir, { recursive: true });
  const db = openDb(process.env.LEAD_DESK_DB || join(leadsDir, "lead-desk.db"));
  ctx.db = db;
  const skip = await preflight(db);
  if (skip || process.argv.includes("--check-only")) {
    say(skip || "Ready: an unattended run would start now (check only, nothing run).");
    db.close();
    process.exit(0);
  }
  writeFileSync(lockFile, String(process.pid));
  const started = Date.now(), deadline = started + minutes * 60000;
  const jobs = [];
  let idle = 0;
  try {
    while (Date.now() < deadline + 15 * 60000) {
      if (jobStatus()?.status === "running") { await new Promise((r) => setTimeout(r, 5000)); continue; }
      if (Date.now() >= deadline) break;
      if (await deskOpen()) { say("The Desk was opened; handing over to its worker."); break; }
      const before = jobStatus();
      try { automationTick(ctx); } catch (e) { say(`automation step failed: ${e.message}`); log(db, null, "automation paused", { reason: e.message, unattended: true }); break; }
      const after = jobStatus();
      if (after && after.id !== before?.id && after.status === "running") { idle = 0; jobs.push(after.label); say(`started: ${after.label}`); continue; }
      if (++idle >= 2) break;
      await new Promise((r) => setTimeout(r, 5000));
    }
  } finally {
    const summary = { minutes: Math.round((Date.now() - started) / 60000), steps: jobs.length, labels: jobs.slice(0, 20) };
    log(db, null, "unattended run", summary);
    say(`done: ${JSON.stringify(summary)}`);
    rmSync(lockFile, { force: true });
    db.close();
  }
  process.exit(0);
}
