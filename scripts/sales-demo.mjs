// Isolated fictional Sales workspace. Never opens kriv-leads or starts automation.
import { createServer } from "node:http";
import { readFileSync, mkdtempSync } from "node:fs";
import { join, resolve, dirname, sep, extname } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { openDb, now } from "../lead-desk/lib/db.mjs";
import { salesRoutes, importProspects, saveResearch, salesDetail } from "../lead-desk/lib/sales.mjs";

export async function startSalesDemo({ port = 4324, salesGenerate, salesProbe, database } = {}) {
  const folder = mkdtempSync(join(tmpdir(), "kriv-sales-demo-"));
  const db = openDb(database ?? join(folder, "fictional.db"));
  const token = randomBytes(24).toString("hex");
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../lead-desk/public");
  const names = [["Alder Air", "alder-air.example", "website_issue", "The service menu links to a missing page.", "website"], ["Juniper Home Services", "juniper-home.example", "booking_gap", "The contact page asks visitors to telephone to arrange a visit.", "build"], ["Cedar Workshop", "cedar-workshop.example", "observation", "The business describes repairs for local households.", "discovery"]];
  for (const [name, host, type, claim, offer] of names) {
    const id = importProspects(db, { businesses: [{ name, website: `https://${host}` }] }).ids[0];
    const detail = salesDetail(db, id);
    if (!detail.evidence.length) saveResearch(db, id, { expectedRevision: detail.revision, offer, evidence: [{ id: "sample-evidence", type, claim, url: `https://${host}`, observedAt: now(), confirmed: true }] });
  }
  const requests = [];
  const server = createServer(async (req, res) => {
    const send = (status, body, type = "application/json") => { res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" }); res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
    try {
      if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host ?? "")) return send(421, { error: "Wrong host" });
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (req.method === "GET" && url.pathname === "/sales-ready") return send(200, "kriv-sales-demo-v1", "text/plain");
      if (url.pathname.startsWith("/api/")) {
        requests.push({ method: req.method, path: url.pathname });
        if (req.method !== "GET" && req.headers["x-desk-token"] !== token) return send(403, { error: "Reload the page before making changes." });
        const route = salesRoutes.find(([method, pattern]) => method === req.method && pattern.test(url.pathname));
        if (!route) return send(404, { error: "This fictional preview covers Sales. Existing production tools are available in your normal Lead Desk." });
        let raw = ""; for await (const chunk of req) { raw += chunk; if (raw.length > 600000) return send(413, { error: "Request too large" }); }
        const result = await route[2]({ db, params: url.pathname.match(route[1]).groups ?? {}, query: Object.fromEntries(url.searchParams), body: raw ? JSON.parse(raw) : {}, salesGenerate, salesProbe });
        return send(result?.httpStatus ?? 200, result?.httpStatus ? result.body : result);
      }
      const file = resolve(root, url.pathname === "/" ? "index.html" : url.pathname.slice(1));
      if (!file.startsWith(root + sep)) return send(404, "Not found", "text/plain");
      let data = readFileSync(file);
      if (file.endsWith("index.html")) data = data.toString().replace("__DESK_TOKEN__", token)
        .replace('<main id="view"', '<div class="sales-callout" role="note">Fictional preview · sample businesses only · existing preview tools remain in your normal Lead Desk.</div><main id="view"')
        .replace('<script type="module"', '<script>if (!location.hash) location.hash="sales";</script><script type="module"');
      send(200, data, { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" }[extname(file)] ?? "application/octet-stream");
    } catch { send(400, { error: "The request could not be completed in this fictional preview." }); }
  });
  await new Promise((resolveStart, reject) => { server.once("error", reject); server.listen(port, "127.0.0.1", resolveStart); });
  return { db, folder, server, requests, url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolveClose => server.close(() => { db.close(); resolveClose(); })) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const demo = await startSalesDemo();
  console.log(`KRIV Sales fictional preview: ${demo.url}/#sales`);
  process.on("SIGINT", async () => { await demo.close(); process.exit(0); });
}
