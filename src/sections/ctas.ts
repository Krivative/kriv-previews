import type { SiteData } from "@/lib/site-schema";

export type Cta = { label: string; href: string };

// Default calls to action for a local business: call first, then Messenger.
// A site's hero.primary / hero.secondary override these.
export function defaultCtas(site: SiteData): { primary?: Cta; secondary?: Cta } {
  const b = site.business;
  const call = b.phoneE164 && b.phoneDisplay ? { label: `Call ${b.phoneDisplay}`, href: `tel:${b.phoneE164}` } : undefined;
  const message = b.messenger ? { label: "Message us", href: b.messenger } : undefined;
  const email = b.email ? { label: "Email us", href: `mailto:${b.email}` } : undefined;
  const list = [site.hero.primary, site.hero.secondary, call, message, email].filter((c): c is Cta => Boolean(c));
  return { primary: list[0], secondary: list[1] };
}
