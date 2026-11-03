/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- drives the JavaScript connector over real stdio with a temporary database.
import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openDb, now } from "../lead-desk/lib/db.mjs";
import { upsertLead, addSource } from "../lead-desk/lib/leads.mjs";

function connector(file) {
  const child = spawn(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "lead-desk/mcp/sales-mcp.mjs"], { env: { ...process.env, LEAD_DESK_DB: file }, stdio: ["pipe", "pipe", "ignore"] });
  let buffer = "", next = 1;
  const waiting = new Map();
  child.stdout.on("data", (d) => {
    buffer += d;
    let i;
    while ((i = buffer.indexOf("\n")) >= 0) { const m = JSON.parse(buffer.slice(0, i)); buffer = buffer.slice(i + 1); waiting.get(m.id)?.(m); }
  });
  const call = (method, params) => new Promise((resolve) => { const id = next++; waiting.set(id, resolve); child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n"); });
  const tool = async (name, args) => { const r = (await call("tools/call", { name, arguments: args })).result; return { error: r.isError, data: r.isError ? r.content[0].text : JSON.parse(r.content[0].text) }; };
  return { call, tool, close: () => new Promise((r) => { child.on("exit", r); child.stdin.end(); }) };
}

describe("KRIV Sales connector for the Claude app", () => {
  it("speaks MCP over stdio and keeps every write inside Sales safeguards", async () => {
    const dir = mkdtempSync(join(tmpdir(), "kriv-mcp-")), file = join(dir, "test.db");
    const db = openDb(file);
    const id = upsertLead(db, { name: "Birch Air", state: "TX", niche: "hvac", website: "https://birch-air.example", email: "office@birch-air.example", flags: ["no-https"], checkedAt: now() }, { bucket: "qualified" });
    addSource(db, id, "listing", "https://birch-air.example");
    db.close();
    const c = connector(file);
    try {
      const init = await c.call("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } });
      expect(init.result.serverInfo.name).toBe("kriv-sales");
      expect(init.result.protocolVersion).toBe("2025-06-18");
      const names = (await c.call("tools/list", {})).result.tools.map((t) => t.name);
      expect(names).toEqual(["sales_list_businesses", "sales_get_business", "sales_discover", "sales_start_research", "sales_save_draft"]);
      expect(names.some((n) => /approve|publish|send|opt/.test(n))).toBe(false);
      expect((await c.tool("sales_discover", {})).data.items[0].id).toBe(id);
      const started = (await c.tool("sales_start_research", { id })).data;
      expect(started.evidence[0].confirmed).toBe(false);
      expect(started.business.email).toBeUndefined();
      expect(started.business.hasEmail).toBe(true);
      const listed = (await c.tool("sales_list_businesses", { query: "Birch" })).data;
      expect(listed[0]).not.toHaveProperty("email");
      // Unconfirmed evidence cannot back a draft.
      const refused = await c.tool("sales_save_draft", { id, expectedRevision: started.revision, subject: "Hello", body: "Hello team, a quick question?", evidenceIds: [started.evidence[0].id] });
      expect(refused.error).toBe(true);
      expect(refused.data).toMatch(/Review at least one/);
      expect((await c.call("tools/call", { name: "sales_send_email", arguments: {} })).error.code).toBe(-32602);
      expect((await c.call("resources/list", {})).error.code).toBe(-32601);
    } finally {
      await c.close();
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30000);
});

describe("Sales connector installer finds the Claude app's config", () => {
  const layout = (dirs, files = []) => {
    const base = mkdtempSync(join(tmpdir(), "kriv-cfg-"));
    for (const d of dirs) mkdirSync(join(base, d), { recursive: true });
    for (const f of files) writeFileSync(join(base, f), "");
    return { base, env: { LOCALAPPDATA: join(base, "local"), APPDATA: join(base, "roaming") } };
  };

  it("prefers the Store app's Claude-Data folder over the virtualized Roaming folder", async () => {
    const { configPath } = await import("../scripts/install-sales-connector.mjs");
    const { base, env } = layout(
      ["local/Packages/Claude_pzs8sxrjxfjjc/LocalCache/Roaming/Claude", "local/Claude-Data/claude_pzs8sxrjxfjjc"],
      ["local/Claude-Data/claude_pzs8sxrjxfjjc/lockfile"],
    );
    try {
      expect(configPath(env)).toBe(join(env.LOCALAPPDATA, "Claude-Data", "claude_pzs8sxrjxfjjc", "claude_desktop_config.json"));
    } finally { rmSync(base, { recursive: true, force: true }); }
  });

  it("falls back to the older Store folder, then the classic one", async () => {
    const { configPath } = await import("../scripts/install-sales-connector.mjs");
    const old = layout(["local/Packages/Claude_abc/LocalCache/Roaming/Claude"], ["local/Packages/Claude_abc/LocalCache/Roaming/Claude/lockfile"]);
    const classic = layout([]);
    try {
      expect(configPath(old.env)).toBe(join(old.env.LOCALAPPDATA, "Packages", "Claude_abc", "LocalCache", "Roaming", "Claude", "claude_desktop_config.json"));
      expect(configPath(classic.env)).toBe(join(classic.env.APPDATA, "Claude", "claude_desktop_config.json"));
    } finally { rmSync(old.base, { recursive: true, force: true }); rmSync(classic.base, { recursive: true, force: true }); }
  });
});
