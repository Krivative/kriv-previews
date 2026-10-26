// Optional AI help, off by default. Only when ANTHROPIC_API_KEY is in .env.local AND Kriv switches
// it on: prefill the preview form from the text of their pages, and suggest email or LinkedIn
// wording. Uses the smallest current model (Claude Haiku 5.5). Everything it returns lands in
// the form for Kriv to check; a source URL it gives is kept only if it's one of the pages read.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

export const MODEL = "claude-haiku-5-5";
// US$ per million tokens for prompts up to 100K tokens (Anthropic price list, checked 2026-10-26).
export const PRICE = { input: 0.1, output: 0.5 };

export function aiKey(repo) {
  const f = join(repo, ".env.local");
  return existsSync(f) ? readFileSync(f, "utf8").match(/^ANTHROPIC_API_KEY=(.+)$/m)?.[1].trim() || null : null;
}
export const aiEnabled = (db) => db.prepare("SELECT value FROM settings WHERE key = 'ai_enabled'").get()?.value === "1";
export const costOf = (usage) => ((usage?.input_tokens ?? 0) * PRICE.input + (usage?.output_tokens ?? 0) * PRICE.output) / 1e6;

function client(repo, db) {
  const key = aiKey(repo);
  if (!key) throw new Error("No ANTHROPIC_API_KEY in .env.local: AI help is unavailable.");
  if (!aiEnabled(db)) throw new Error("AI help is switched off (Dashboard, Data).");
  return new Anthropic({ apiKey: key });
}

const Sourced = z.object({ value: z.string(), source_url: z.string() });
const Extract = z.object({
  name: Sourced, category: Sourced, phone: Sourced, street_address: Sourced, town: Sourced, state: Sourced, zip: Sourced,
  about: Sourced,
  hours: z.array(z.object({ days: z.string(), time: z.string(), source_url: z.string() })),
  services: z.array(z.object({ name: z.string(), one_line: z.string(), source_url: z.string() })),
});

const RULES = `You extract facts about a small local business for a concept website preview.
Rules:
- Use only facts stated in the page texts given. Never infer, guess or add anything.
- Every value needs the URL of the page it appears on, copied exactly from the "URL:" line. If a fact is not on any page, return an empty value and an empty source_url.
- Leave out reviews, ratings, testimonials, prices, offers, guarantees, awards, credentials, staff names, years in business and superlatives ("best", "#1").
- Business name and phone exactly as the business writes them.
- Service one-liners: short, neutral descriptions of the service, no promises of outcomes. At most 6 services.`;

/** Form values from their pages. Returns { patch, cost, usage }. */
export async function aiPrefill(repo, db, lead, pages) {
  const readable = pages.filter((p) => p.status === 200 && p.text);
  if (!readable.length) throw new Error("None of their pages could be read.");
  const urls = new Set(readable.map((p) => p.url));
  const body = readable.map((p) => `URL: ${p.url}\n${p.text.slice(0, 12000)}`).join("\n\n---\n\n");
  const res = await client(repo, db).messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: zodOutputFormat(Extract) },
    system: RULES,
    messages: [{ role: "user", content: `Business: ${lead.name} (${lead.niche ?? ""}, ${lead.town ?? ""} ${lead.state ?? ""}).\n\nPages:\n\n${body}` }],
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined this request.");
  const out = res.parsed_output;
  if (!out) throw new Error(`No usable answer (stop reason ${res.stop_reason}).`);
  const ok = (s) => (urls.has(s?.source_url) ? s.source_url : "");
  const f = {};
  const put = (key, s) => { if (s?.value?.trim()) f[key] = { v: s.value.trim(), s: ok(s) }; };
  put("name", out.name); put("category", out.category); put("phone", out.phone); put("line1", out.street_address);
  put("city", out.town); put("region", out.state); put("postalCode", out.zip); put("aboutBody", out.about);
  return {
    patch: {
      f,
      lists: {
        hours: out.hours.filter((h) => h.days && h.time).map((h) => ({ days: h.days, time: h.time, s: ok(h) })),
        services: out.services.slice(0, 6).filter((s) => s.name).map((s) => ({ name: s.name, blurb: s.one_line, s: ok(s) })),
      },
    },
    usage: res.usage, cost: costOf(res.usage),
  };
}

/** A wording suggestion for an email or LinkedIn text; Kriv edits and decides. */
export async function aiSuggest(repo, db, { kind, lead, draft, facts }) {
  const res = await client(repo, db).messages.create({
    model: MODEL,
    max_tokens: 1500,
    output_config: { effort: "low" },
    system: `You help Kriv, a web designer, word short, honest outreach to one small business. Plain, friendly, no pressure, no fake familiarity, no claims beyond the facts given, no invented details. Keep any [[blank]] markers as they are. ${kind === "linkedin" ? "Keep it under 200 characters." : "Keep the same structure and the preview link; don't add a signature block or footer."} Reply with the suggested text only.`,
    messages: [{ role: "user", content: `Business: ${lead.name}, ${lead.town ?? ""} ${lead.state ?? ""}.\nWhat we noticed about their current website: ${facts || "(none given)"}\n\nCurrent draft:\n${draft}` }],
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined this request.");
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  return { text, usage: res.usage, cost: costOf(res.usage) };
}
