// pnpm build && pnpm test:smoke
// Starts the production server and checks the guardrails over real HTTP:
// status codes, X-Robots-Tag, noindex meta, the concept banner, inert links,
// expiry, drafts and unknown slugs. Set BASE_URL to check a deployment instead.
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createReviewToken } from "../src/lib/review-token.ts";

const port = process.env.PORT ?? "3210";
const base = process.env.BASE_URL ?? `http://localhost:${port}/for`;
const banner = "Concept preview prepared by KRIV for Example Family Dental. Not affiliated with or endorsed by Example Family Dental.";

// Private review links: a throwaway secret locally; against a deployment only when its secret is supplied.
const reviewSecret = process.env.BASE_URL ? process.env.PREVIEW_REVIEW_SECRET : randomBytes(32).toString("hex");

let server;
if (!process.env.BASE_URL) {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", port], { stdio: "ignore", env: { ...process.env, PREVIEW_REVIEW_SECRET: reviewSecret } });
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
  ["/test-lead/about", 200, (b) => b.includes(banner) && b.includes('name="robots" content="noindex, nofollow"') && b.includes('aria-current="page"')],
  ["/test-lead/contact", 200, (b) => b.includes(banner) && b.includes("hello@example.com") && !/href="(?:tel:|mailto:)|<form\b|<input\b/.test(b)],
  ["/test-lead/services/check-ups-and-cleaning", 200, (b) => b.includes(banner) && b.includes("A closer look")],
  ["/test-lead/not-a-page", 404, (b) => !b.includes(banner)],
  ["/test-lead/services/not-a-service", 404, (b) => !b.includes(banner)],
  ["/test-draft/about", 404, (b) => !b.includes(banner)],
  ["/test-expired/contact", 200, (b) => b.includes("This preview has expired") && !b.includes("Example Family Dental")],
  ["/does-not-exist/contact", 404, (b) => !b.includes(banner)],
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

if (reviewSecret) {
  const token = (slug, opts = {}) => createReviewToken(slug, { secret: reviewSecret, ...opts });
  const valid = token("test-draft");
  const review = [
    ["/test-draft?review=" + valid, 200, (b, r) => b.includes(banner) && /HttpOnly/i.test(r.headers.get("set-cookie") ?? "")],
    ["/test-draft?review=" + valid.slice(0, -2) + "xx", 404, (b) => !b.includes(banner)],
    ["/test-draft?review=" + token("test-lead"), 404, (b) => !b.includes(banner)],
    ["/test-draft?review=" + token("test-draft", { today: "2020-01-01" }), 404, (b) => !b.includes(banner)],
  ];
  for (const [path, status, bodyOk] of review) {
    const res = await fetch(`${base}${path}`, { redirect: "manual" });
    const body = await res.text();
    const ok = res.status === status && res.headers.get("x-robots-tag") === "noindex, nofollow" && bodyOk(body, res);
    if (!ok) failed = true;
    console.log(`${ok ? "ok  " : "FAIL"} ${path.replace(/review=.*/, "review=…")}  status=${res.status} (want ${status})  private review`);
  }
  // The cookie from a valid link opens the draft's internal pages; without it they stay 404.
  const res = await fetch(`${base}/test-draft/about`, { headers: { cookie: `kriv_review_test-draft=${valid}` }, redirect: "manual" });
  const ok = res.status === 200 && (await res.text()).includes(banner);
  if (!ok) failed = true;
  console.log(`${ok ? "ok  " : "FAIL"} /test-draft/about with review cookie  status=${res.status} (want 200)  private review`);
}

server?.kill();
process.exit(failed ? 1 : 0);
