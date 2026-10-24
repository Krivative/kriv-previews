import { z } from "zod";

// The only contract between a lead's content (leads/<slug>.json) and the
// templates. Templates render whatever is here and hide sections whose data is
// missing. Never invent facts to fill a field: leave it out.
//
// Shared with Site Arsenal (Krivative/Site-Arsenal) except for the lead fields
// at the end and the country-neutral address. See docs/SYNC.md.

const Link = z.object({ label: z.string(), href: z.string() });
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD");

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Previews are served at https://kriv.agency/<slug>, next to the main site's own
// pages. The main site always wins, so a lead may never use one of these names.
// Keep in sync with the top-level routes and public files of Krivative/Kriv.
export const RESERVED_SLUGS = new Set([
  // Krivative/Kriv app routes and files today
  "about", "api", "book", "build", "insights", "privacy", "robots", "sitemap", "favicon",
  // this app's own prefix and Next.js internals
  "for", "_next",
  // likely future main-site pages
  "admin", "blog", "careers", "case-studies", "contact", "faq", "jobs", "legal", "login",
  "pricing", "projects", "services", "terms", "work",
]);
export const LeadStatus = z.enum(["draft", "approved", "sent", "replied", "expired"]);
export type LeadStatus = z.infer<typeof LeadStatus>;

// Section types and their variants. A template picks a default list; a site may
// override the whole list (to reorder, hide or swap variants) via `design.sections`.
export const SectionRef = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), variant: z.enum(["split", "poster", "centered", "banner", "stacked"]) }),
  z.object({ type: z.literal("services"), variant: z.enum(["rows", "grid", "columns", "menu", "tiles"]) }),
  z.object({ type: z.literal("about"), variant: z.enum(["quote", "split"]) }),
  z.object({ type: z.literal("gallery"), variant: z.enum(["mosaic", "strip"]) }),
  z.object({ type: z.literal("custom"), variant: z.enum(["strip", "note", "steps"]) }),
  z.object({ type: z.literal("visit"), variant: z.enum(["split", "card"]) }),
  z.object({ type: z.literal("faq"), variant: z.enum(["list", "columns"]) }),
  z.object({ type: z.literal("close"), variant: z.enum(["band", "card", "statement"]) }),
]);
export type SectionRef = z.infer<typeof SectionRef>;
export type SectionType = SectionRef["type"];

export const SiteData = z.object({
  slug: z
    .string()
    .max(80)
    .regex(SLUG_PATTERN)
    .refine((v) => !RESERVED_SLUGS.has(v), { message: "slug is a kriv.agency page name" }),
  template: z.string(),
  // BCP 47 language tag for the page content, e.g. "en-US", "en-AU".
  lang: z.string().default("en"),
  business: z.object({
    name: z.string(),
    category: z.string(),
    phoneDisplay: z.string().optional(),
    phoneE164: z.string().optional(),
    email: z.string().email().optional(),
    messenger: z.string().url().optional(),
    address: z.object({
      line1: z.string().optional(),
      city: z.string(),
      // State, province or region, as the business writes it.
      region: z.string().optional(),
      postalCode: z.string().optional(),
      // ISO 3166-1 alpha-2, e.g. "US", "AU", "NZ", "CA", "PH".
      country: z.string().regex(/^[A-Z]{2}$/),
    }),
    mapsUrl: z.string().url().optional(),
    socials: z.record(z.string(), z.string().url()).default({}),
    hours: z.array(z.object({ days: z.string(), time: z.string() })).default([]),
  }),
  // Lead-level tailoring knobs. Everything is optional; the template supplies defaults.
  design: z
    .object({
      accent: z.string().optional(),
      fonts: z.object({ display: z.string(), body: z.string() }).optional(),
      sections: z.array(SectionRef).optional(),
    })
    .default({}),
  brand: z.object({ logo: z.string().optional(), photos: z.array(z.string()).default([]) }).default({ photos: [] }),
  hero: z.object({
    eyebrow: z.string().max(40).optional(),
    headline: z.string().max(70),
    sub: z.string().max(160),
    primary: Link.optional(),
    secondary: Link.optional(),
  }),
  services: z
    .object({
      title: z.string().default("What we do"),
      intro: z.string().max(200).optional(),
      items: z.array(z.object({ name: z.string(), blurb: z.string().max(180) })).max(8),
    })
    .optional(),
  about: z.object({ title: z.string().optional(), body: z.string().max(700) }).optional(),
  // The one section that is written for this lead only.
  custom: z
    .object({
      title: z.string(),
      body: z.string().max(400).optional(),
      items: z.array(z.object({ name: z.string(), blurb: z.string().max(160).optional() })).max(6).default([]),
    })
    .optional(),
  gallery: z.object({ title: z.string().optional(), labels: z.array(z.string()).max(8).default([]) }).optional(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).max(8).default([]),
  close: z.object({ headline: z.string().max(80), sub: z.string().max(160).optional() }).optional(),
  seo: z.object({ title: z.string().max(70), description: z.string().max(160) }),

  // Lead fields. `sources` lists the public pages every fact on the page came from.
  sources: z.array(z.string().url()).min(1),
  createdAt: IsoDate,
  // Last day the preview is served (UTC). Default is createdAt + 30 days.
  expiresAt: IsoDate,
  status: LeadStatus,
}).refine((d) => d.expiresAt >= d.createdAt, { message: "expiresAt is before createdAt", path: ["expiresAt"] });
export type SiteData = z.infer<typeof SiteData>;
export type SiteInput = z.input<typeof SiteData>;
