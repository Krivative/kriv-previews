// KRIV Sales connector for the Claude desktop app: a local MCP server over stdio
// (newline-delimited JSON-RPC, no SDK). Opens the Desk database (LEAD_DESK_DB
// overrides the default) and exposes only Sales reads plus two safe writes:
// adding unconfirmed site-check findings and saving an edited draft. It can never
// approve, publish, send email, touch LinkedIn or change the do-not-contact list.
// Business email addresses and imported contact claims are never returned.
import { createInterface } from "node:readline";
import { openDb } from "../lib/db.mjs";
import { salesDetail, discoverList, discoverResearch, saveSalesDraft, OFFERS } from "../lib/sales.mjs";

const db = openDb();
const VERSION = "1.0.0";
const strip = (d) => ({ ...d, business: { ...d.business, email: undefined, hasEmail: !!d.business.email }, contacts: undefined, contactClaims: d.contacts.length });
const obj = (properties, required = []) => ({ type: "object", properties, required, additionalProperties: false });
const str = (description) => ({ type: "string", description });

export const TOOLS = [
  { name: "sales_list_businesses", description: "List up to 50 KRIV Sales businesses (most recently updated first), optionally filtered by name or website text.",
    inputSchema: obj({ query: str("Optional text to match in the name or website") }),
    run: ({ query = "" }) => {
      const q = `%${String(query).slice(0, 100)}%`;
      return db.prepare("SELECT l.id, l.name, l.town, l.state, l.niche, l.website, l.status, l.bucket, s.offer, s.draft IS NOT NULL hasDraft FROM leads l LEFT JOIN sales_workspaces s ON s.lead_id=l.id WHERE l.name LIKE ? OR l.website LIKE ? ORDER BY l.updated_at DESC LIMIT 50").all(q, q)
        .map((r) => ({ ...r, offer: r.offer ? OFFERS[r.offer] : null, hasDraft: !!r.hasDraft }));
    } },
  { name: "sales_get_business", description: "One business's Sales record: evidence (with confirmed flags), offer, suggested offer, saved draft, holds and recent activity. Use its revision when saving a draft.",
    inputSchema: obj({ id: str("Business id from sales_list_businesses or sales_discover") }, ["id"]),
    run: ({ id }) => strip(salesDetail(db, id)) },
  { name: "sales_discover", description: "Businesses the Desk's finder already found and checked, with site-check findings and no Sales research yet. qualified = weak website (offer a website); toReview = modern website (offer SEO, social media marketing or management, ads, booking and CRM setup); near = no confirmed business email yet.",
    inputSchema: obj({ bucket: { type: "string", enum: ["qualified", "near", "toReview"] }, niche: str("Optional niche, e.g. hvac"), state: str("Optional two-letter state") }),
    run: (args) => discoverList(db, args) },
  { name: "sales_start_research", description: "Add a business's site-check findings as UNCONFIRMED observations. Kriv confirms each one in the Desk before it counts.",
    inputSchema: obj({ id: str("Business id"), expectedRevision: { type: "integer", description: "Revision from sales_get_business; omit only for a business with no research yet" } }, ["id"]),
    run: ({ id, expectedRevision }) => strip(discoverResearch(db, id, expectedRevision ?? null)) },
  { name: "sales_save_draft", description: "Save an unsent first-email draft for Kriv to review in the Desk. Plain text, under 150 words, no links/addresses/placeholders, citing only confirmed evidence ids from the last 30 days. Never sends anything.",
    inputSchema: obj({ id: str("Business id"), expectedRevision: { type: "integer" }, subject: str("Subject line"), body: str("Email body"), evidenceIds: { type: "array", items: { type: "string" }, description: "Confirmed evidence ids the draft relies on" } }, ["id", "expectedRevision", "subject", "body", "evidenceIds"]),
    run: (args) => strip(saveSalesDraft(db, args.id, args)) },
];

function reply(id, result, error) {
  process.stdout.write(JSON.stringify(error ? { jsonrpc: "2.0", id, error } : { jsonrpc: "2.0", id, result }) + "\n");
}

function handle(msg) {
  const { id, method, params = {} } = msg;
  if (id === undefined) return; // notifications (e.g. notifications/initialized)
  if (method === "initialize") return reply(id, { protocolVersion: params.protocolVersion ?? "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "kriv-sales", version: VERSION },
    instructions: "KRIV Sales workspace. Drafts you save are unsent and need Kriv's review in the Lead Desk. Never claim an email was sent." });
  if (method === "ping") return reply(id, {});
  if (method === "tools/list") return reply(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
  if (method === "tools/call") {
    const tool = TOOLS.find((t) => t.name === params.name);
    if (!tool) return reply(id, null, { code: -32602, message: `Unknown tool ${params.name}` });
    try { return reply(id, { content: [{ type: "text", text: JSON.stringify(tool.run(params.arguments ?? {}), null, 2) }] }); }
    catch (e) { return reply(id, { content: [{ type: "text", text: e.message }], isError: true }); }
  }
  return reply(id, null, { code: -32601, message: `Method not found: ${method}` });
}

const lines = createInterface({ input: process.stdin });
lines.on("line", (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return reply(null, null, { code: -32700, message: "Parse error" }); }
  handle(msg);
});
lines.on("close", () => { db.close(); process.exit(0); });
