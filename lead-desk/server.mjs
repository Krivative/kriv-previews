// KRIV Lead Desk: `corepack pnpm lead-desk` starts it on http://localhost:4321 and opens the
// browser. Local only: it listens on 127.0.0.1, checks the Host header, and every change needs
// the token printed into the page at startup, so other websites can't drive it. See docs/LEAD-DESK.md.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, createReadStream } from "node:fs";
import { join, extname, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { openDb } from "./lib/db.mjs";
import { routes } from "./lib/api.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.LEAD_DESK_PORT ?? 4321);
const TOKEN = randomBytes(24).toString("hex");
const db = openDb();
const ctx = { db, repo: resolve(here, ".."), leadsDir: join(homedir(), "kriv-leads"), reportsDir: join(homedir(), "kriv-reports") };

// Screenshots may be served from these folders only.
const FILE_ROOTS = [ctx.leadsDir, ctx.reportsDir, join(ctx.repo, "shots")].map((p) => resolve(p) + sep);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json" };
const HEADERS = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" };

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { ...HEADERS, "Content-Type": type });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readBody(req) {
  let s = "";
  for await (const chunk of req) { s += chunk; if (s.length > 5e6) throw new Error("body too large"); }
  return s ? JSON.parse(s) : {};
}

const server = createServer(async (req, res) => {
  try {
    // DNS-rebinding guard: only answer requests addressed to this machine.
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host ?? "")) return send(res, 421, { error: "wrong host" });
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      if (req.method !== "GET" && req.headers["x-desk-token"] !== TOKEN) return send(res, 403, { error: "missing or wrong token; reload the page" });
      for (const [method, pattern, handler] of routes) {
        const m = method === req.method && url.pathname.match(pattern);
        if (!m) continue;
        const body = req.method === "GET" ? {} : await readBody(req);
        const out = await handler({ ...ctx, params: m.groups ?? {}, query: Object.fromEntries(url.searchParams), body });
        return out?.httpStatus ? send(res, out.httpStatus, out.body) : send(res, 200, out);
      }
      return send(res, 404, { error: "no such endpoint" });
    }

    if (url.pathname === "/file") {
      const p = resolve(url.searchParams.get("path") ?? "");
      if (!FILE_ROOTS.some((r) => p.startsWith(r)) || !existsSync(p) || !statSync(p).isFile() || !TYPES[extname(p).toLowerCase()]) return send(res, 404, "not found", "text/plain");
      res.writeHead(200, { ...HEADERS, "Content-Type": TYPES[extname(p).toLowerCase()] });
      return createReadStream(p).pipe(res);
    }

    const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = resolve(here, "public", name);
    if (!file.startsWith(resolve(here, "public") + sep) || !existsSync(file)) return send(res, 404, "not found", "text/plain");
    let body = readFileSync(file);
    if (name === "index.html") body = body.toString().replace("__DESK_TOKEN__", TOKEN);
    send(res, 200, body, TYPES[extname(file)] ?? "application/octet-stream");
  } catch (e) {
    console.error(e);
    send(res, 500, { error: String(e.message ?? e) });
  }
});

const url = `http://localhost:${PORT}`;
const openBrowser = () => { if (!process.argv.includes("--no-open")) execFile("cmd", ["/c", "start", "", url]); };
server.on("error", (e) => {
  if (e.code !== "EADDRINUSE") throw e;
  // Started twice: the first desk keeps running; just show it.
  console.log(`The Lead Desk is already running at ${url} (close its window, or press Ctrl+C there, to stop it).`);
  openBrowser();
  process.exit(0);
});
// Ctrl+C: exit normally so the preview app started for screenshots (next dev) stops too.
process.on("SIGINT", () => process.exit(0));
server.listen(PORT, "127.0.0.1", () => {
  console.log(`KRIV Lead Desk: ${url}  (database ${process.env.LEAD_DESK_DB || join(ctx.leadsDir, "lead-desk.db")}; Ctrl+C to stop)`);
  openBrowser();
});
