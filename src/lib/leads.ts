import { SiteData, SLUG_PATTERN } from "./site-schema";
import { jsonLeadStore, type LeadStore } from "./lead-store";
import { templates } from "@/templates";
import type { TemplateDef } from "./templates";

export type LeadResult =
  | { kind: "live"; site: SiteData; template: TemplateDef }
  | { kind: "expired" };

export type GetLeadOptions = {
  store?: LeadStore;
  /** Today's date in UTC as YYYY-MM-DD. */
  today?: string;
  /** Serve `draft` records. Only true under `next dev`. */
  allowDrafts?: boolean;
};

const defaultStore = jsonLeadStore();

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** createdAt + 30 days, the default lifetime of a preview. */
export function defaultExpiry(createdAt: string, days = 30): string {
  const d = new Date(`${createdAt}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isExpired(site: Pick<SiteData, "status" | "expiresAt">, today: string): boolean {
  return site.status === "expired" || today > site.expiresAt;
}

/**
 * Looks up a lead by slug. Returns null for anything that must look like a plain
 * 404: a malformed slug, no record, or a draft outside development. A record that
 * fails validation throws, so a broken lead is a loud error, not a silent 404.
 */
export async function getLead(slug: string, opts: GetLeadOptions = {}): Promise<LeadResult | null> {
  const { store = defaultStore, today = todayUtc(), allowDrafts = process.env.NODE_ENV === "development" } = opts;
  if (!SLUG_PATTERN.test(slug) || slug.length > 80) return null;

  const raw = await store.get(slug);
  if (raw === null) return null;

  const site = SiteData.parse(raw);
  if (site.slug !== slug) throw new Error(`Lead file "${slug}" has slug "${site.slug}"`);
  if (site.status === "draft" && !allowDrafts) return null;
  if (isExpired(site, today)) return { kind: "expired" };

  const template = templates[site.template];
  if (!template) throw new Error(`Lead "${slug}" uses unknown template "${site.template}"`);
  return { kind: "live", site, template };
}
