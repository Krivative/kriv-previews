// pnpm build && pnpm test:smoke
// Starts the production server and checks the guardrails over real HTTP:
// status codes, X-Robots-Tag, noindex meta, the concept banner, inert links,
// expiry, drafts and unknown slugs. Set BASE_URL to check a deployment instead.
import { spawn } from "node:child_process";

const port = process.env.PORT ?? "3210";
const base = process.env.BASE_URL ?? `http://localhost:${port}/for`;
const banner = "Concept preview prepared by KRIV for Example Family Dental. Not affiliated with or endorsed by Example Family Dental.";

let server;
if (!process.env.BASE_URL) {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", port], { stdio: "ignore" });
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`${base}/test-lead`);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

const checks = [
  ["/test-lead", 200, (b) => b.includes(banner) && /<meta name="robots" content="noindex, nofollow"/.test(b) && !/href="(tel:|mailto:|https?:\/\/(?!fonts\.))/.test(b.split("</head>")[1] ?? "")],
  ["/test-expired", 200, (b) => b.includes("This preview has expired") && !b.includes("Example Family Dental")],
  ["/test-draft", 404, (b) => !b.includes("Example Family Dental")],
  ["/does-not-exist", 404, (b) => b.includes("Nothing here") && !b.includes("test-lead")],
  ["/TEST-LEAD", 200, (b) => b.includes(banner)],
  ["/about", 404, () => true],
  ["/..%2Fpackage", 404, () => true],
  ["", 404, (b) => !b.includes("test-lead")],
];

let failed = false;
for (const [path, status, bodyOk] of checks) {
  const res = await fetch(`${base}${path}`, { redirect: "manual" });
  const body = await res.text();
  const robots = res.headers.get("x-robots-tag");
  const ok = res.status === status && robots === "noindex, nofollow" && bodyOk(body);
  if (!ok) failed = true;
  console.log(`${ok ? "ok  " : "FAIL"} ${path || "/"}  status=${res.status} (want ${status})  x-robots-tag=${robots}`);
}

server?.kill();
process.exit(failed ? 1 : 0);
