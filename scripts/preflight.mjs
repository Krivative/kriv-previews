// One command before starting work and before every publish.
//   node scripts/preflight.mjs            where this checkout stands against the live branch, then the five checks
//   node scripts/preflight.mjs --status   only where it stands (seconds)
// It fetches, never pushes, never merges. Exit code 0 only when it is safe to publish.
//
// Why it exists (17 Nov 2026): two sessions published to main in the same days. One found out at push
// time that main had moved by 16 commits, and merged seven conflicted files by hand. This says so first.
import { execFileSync, spawnSync } from "node:child_process";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const statusOnly = process.argv.includes("--status");
let safe = true;
const say = (ok, text) => { if (!ok) safe = false; console.log(`${ok ? "ok  " : "STOP"}  ${text}`); };

try { git("fetch", "--quiet", "origin"); } catch { say(false, "could not reach origin: the comparison below may be stale"); }
const branch = git("branch", "--show-current");
const [behind, ahead] = git("rev-list", "--left-right", "--count", "origin/main...HEAD").split(/\s+/).map(Number);
const dirty = git("status", "--porcelain").split("\n").filter((l) => l && !l.startsWith("??"));
console.log(`Branch ${branch}: ${ahead} commit${ahead === 1 ? "" : "s"} not on the live branch, ${behind} behind it.`);
say(dirty.length === 0, dirty.length ? `${dirty.length} uncommitted change${dirty.length === 1 ? "" : "s"}: commit or set aside before publishing` : "working tree is clean");
if (behind) {
  // Files both sides touched since they parted: where a merge will need a person.
  const base = git("merge-base", "origin/main", "HEAD");
  const theirs = new Set(git("diff", "--name-only", base, "origin/main").split("\n").filter(Boolean));
  const both = git("diff", "--name-only", base, "HEAD").split("\n").filter((f) => theirs.has(f));
  say(false, `the live branch has ${behind} commit${behind === 1 ? "" : "s"} this checkout does not: merge origin/main in before publishing`);
  console.log(`      Latest there: ${git("log", "-1", "--pretty=%s (%cr)", "origin/main")}`);
  if (both.length) console.log(`      Changed on both sides (${both.length}): ${both.slice(0, 8).join(", ")}${both.length > 8 ? ", ..." : ""}`);
} else say(true, "nothing new on the live branch");

if (!statusOnly) {
  // The five checks, in order. The build is retried once: Next.js stops the first run to print a security advisory, if it has one.
  const steps = [["lint"], ["typecheck"], ["test"], ["build"], ["test:smoke"]];
  for (const [name] of steps) {
    const started = Date.now();
    let run = spawnSync("pnpm", [name], { encoding: "utf8" });
    let note = "";
    if (name === "build" && run.status !== 0 && /security vulnerability|SecurityFatalError/.test(`${run.stdout}${run.stderr}`)) { note = " (after a Next.js security advisory: an upgrade is recommended)"; run = spawnSync("pnpm", [name], { encoding: "utf8" }); }
    say(run.status === 0, `${name}${note} in ${Math.round((Date.now() - started) / 1000)}s`);
    if (run.status !== 0) { console.log(`${run.stdout}${run.stderr}`.split("\n").slice(-25).join("\n")); break; }
  }
}
console.log(safe ? "\nSafe to publish, once Kriv says so." : "\nNot safe to publish yet.");
process.exit(safe ? 0 : 1);
