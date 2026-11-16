// The workflow's own numbers, from the repository. Read-only; prints one short report.
//   node scripts/workflow-check.mjs [days]     looks back that many days (default 7)
// Token use is measured separately from session transcripts: python3 scripts/token-usage.py <transcripts folder>.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { checkLead, summarise } from "./lib/offer-ready.mjs";

const days = Number(process.argv[2]) || 7;
const git = (...a) => { try { return execFileSync("git", a, { encoding: "utf8" }).trim(); } catch { return ""; } };
const size = (f) => (existsSync(f) ? statSync(f).size : 0);
const tokens = (bytes) => Math.round(bytes / 4);
const line = (label, value, note = "") => console.log(`${label.padEnd(44)} ${String(value).padStart(8)}  ${note}`);

// 1. What a new session must read before it can work, and so carries on every turn after.
const startFiles = /Read STATE\.md/.test(readFileSync("CLAUDE.md", "utf8")) ? ["CLAUDE.md", "STATE.md"] : ["CLAUDE.md", "HANDOFF.md", "docs/PLAN.md"];
const startBytes = startFiles.reduce((n, f) => n + size(f), 0);
console.log(`Workflow check, last ${days} days\n`);
line("Start-of-session reading (tokens, about)", tokens(startBytes), startFiles.join(" + "));
line("  the full history, if read whole", tokens(size("HANDOFF.md")), "HANDOFF.md");

// 2. How the work moved.
const since = `--since=${days} days ago`;
const subjects = git("log", since, "--pretty=%s").split("\n").filter(Boolean);
const notes = subjects.filter((s) => /^(handoff|roadmap)\b/i.test(s)).length;
line("Commits", subjects.length);
line("  of which notes only", notes, subjects.length ? `${Math.round((100 * notes) / subjects.length)}%` : "");
line("Merges", git("log", since, "--merges", "--oneline").split("\n").filter(Boolean).length);
git("fetch", "--quiet", "origin");
const [behind, ahead] = (git("rev-list", "--left-right", "--count", "origin/main...HEAD") || "0 0").split(/\s+/).map(Number);
line("Behind the live branch", behind, behind ? "merge before publishing" : "");
line("Not yet on the live branch", ahead);
line("Local branches not merged", git("branch", "--no-merged", "origin/main").split("\n").filter(Boolean).length);

// 3. Fragile tests: assertions tied to one live client's record break whenever that client is restyled.
const tied = readdirSync("tests").filter((f) => /\.test\.tsx?$/.test(f)).reduce((n, f) => n + (readFileSync(path.join("tests", f), "utf8").match(/pco-dental-clinic|dv-shop-cebu/g) ?? []).length, 0);
line("Test references to live client records", tied, "use fixtures for look-specific checks");

// 4. The point of it all: leads a client could be sent today.
const today = new Date().toISOString().slice(0, 10);
const leads = readdirSync("leads").filter((f) => f.endsWith(".json") && !f.startsWith("test-")).map((f) => JSON.parse(readFileSync(path.join("leads", f), "utf8")));
const sum = summarise(leads.map((l) => checkLead(l, today)));
line("Leads offer-ready", `${sum.ready}/${sum.total}`);
for (const [why, count] of sum.blockers.slice(0, 3)) console.log(`${" ".repeat(46)}${String(count).padStart(6)}  ${why}`);
