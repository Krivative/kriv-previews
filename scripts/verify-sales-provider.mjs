// One fictional live-provider check. Never opens the Desk database or starts automation.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { probeClaude, generateWithHarvey } from "../lead-desk/lib/harvey-runtime.mjs";
import { validateDraft } from "../lead-desk/lib/sales.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = resolve(root, "shots/sales-provider-check.json");
const installationOnly = process.argv.includes("--installation-only");
const started = Date.now();
const report = { checkedAt: new Date().toISOString(), mode: installationOnly ? "installation-only" : "live-fictional", liveVerified: false };
try {
  const health = await probeClaude();
  report.installation = health;
  if (!health.available) throw new Error(health.reason);
  if (!installationOnly) {
    console.log("Checking one fictional draft (up to three minutes). No email will be sent.");
    const evidence = [{ id: "fictional-check", type: "observation", claim: "This fictional business describes household repairs on its home page.", url: "https://cedar-workshop.example", observedAt: new Date().toISOString(), confirmed: true }];
    const draft = validateDraft(await generateWithHarvey({ name: "Cedar Workshop (fictional test business)", offer: "discovery", evidence }), evidence);
    report.liveVerified = true;
    report.wordCount = draft.body.split(/\s+/).length;
    // Store only validation results, never account details, model output or prompts.
  }
  report.result = installationOnly ? "installation-passed-live-not-tested" : "live-draft-passed";
} catch (error) {
  report.result = "failed";
  report.reason = error.message;
  process.exitCode = 1;
} finally {
  report.elapsedMs = Date.now() - started;
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  console.log(`Result saved to ${reportPath}`);
}
