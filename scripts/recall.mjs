// Remember without re-reading: search the project's memory and print only what matches.
//   node scripts/recall.mjs <words...> [--max 30]
// Looks in STATE.md, docs/DECISIONS.md, HANDOFF.md, docs/ROADMAP.md, the other docs and commit subjects.
// A line matches when it contains every word (any case). Output is capped, most trusted source first,
// so a lookup costs a few hundred tokens instead of the whole history.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const maxAt = args.indexOf("--max");
const max = maxAt >= 0 ? Number(args.splice(maxAt, 2)[1]) || 30 : 30;
const words = args.map((w) => w.toLowerCase());
if (!words.length) { console.error("usage: node scripts/recall.mjs <words...> [--max 30]"); process.exit(1); }

const docs = existsSync("docs") ? readdirSync("docs").filter((f) => f.endsWith(".md") && !["DECISIONS.md", "ROADMAP.md"].includes(f)).map((f) => path.join("docs", f)) : [];
const files = ["STATE.md", "docs/DECISIONS.md", "HANDOFF.md", "docs/ROADMAP.md", ...docs].filter((f) => existsSync(f));
const hit = (text) => { const t = text.toLowerCase(); return words.every((w) => t.includes(w)); };
const clip = (text) => (text.length > 240 ? `${text.slice(0, 237)}...` : text);

let shown = 0, total = 0;
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  let heading = "";
  for (const [n, line] of lines.entries()) {
    if (/^#{1,4} /.test(line)) heading = line.replace(/^#+ /, "");
    if (!line.trim() || !hit(line)) continue;
    total++;
    if (shown < max) { console.log(`${file}:${n + 1}${heading && !/^#/.test(line) ? `  [${clip(heading).slice(0, 60)}]` : ""}\n  ${clip(line.trim())}`); shown++; }
  }
}
let commits = [];
try { commits = execFileSync("git", ["log", "--pretty=%h %ad %s", "--date=short", "-n", "600"], { encoding: "utf8" }).split("\n").filter(hit); } catch { /* not a repository */ }
for (const c of commits) { total++; if (shown < max) { console.log(`commit ${clip(c)}`); shown++; } }
console.log(total ? `\n${shown} of ${total} matches shown${total > shown ? `; narrow the words or pass --max ${Math.min(total, 100)}` : ""}. Open a file at its line number for the full passage.` : "Nothing recorded under those words. If Kriv decided it, it should be in docs/DECISIONS.md: add it.");
