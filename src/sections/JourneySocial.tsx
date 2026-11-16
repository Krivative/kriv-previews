import type { SiteData } from "@/lib/site-schema";
import { dentalJourney } from "@/stories/dental-journey";
import { JourneyLogo, logoWords } from "./JourneyLogo";
import b from "./brandkit.module.css";

// The brand on social media, as mock-ups (preview-only): a page cover, a profile
// picture, a square post and a story cover, built from the concept logo, the
// site's theme and lines from the story. Shown on the brand kit page and on the
// client's own site, so the clinic sees its pages and its website as one look.
// These are drawings, not posts: nothing is published to any social account.

const line = (id: string) => dentalJourney.find((step) => step.id === id)?.title ?? "";

export function SocialShowcase({ site }: { site: SiteData }) {
  const { business } = site;
  const { letters, ring } = logoWords(site);
  const place = business.address.city.startsWith("[") ? business.category : `${business.category} in ${business.address.city}`;
  return <ul className={b.media}>
    <li className={b.wide}>
      <div className={`${b.mock} ${b.cover}`}><JourneyLogo letters={letters} ring={ring} /><div><p className={b.display}>{line("smile")}</p><p className={b.label}>{place}</p></div></div>
      <span>Page cover</span>
    </li>
    <li>
      <div className={`${b.mock} ${b.profile}`}><JourneyLogo letters={letters} compact tone="lime" /></div>
      <span>Profile picture</span>
    </li>
    <li>
      <div className={`${b.mock} ${b.post}`}><p className={b.label}>At home</p><p className={b.display}>{line("home")}</p><JourneyLogo letters={letters} compact /></div>
      <span>Square post</span>
    </li>
    <li>
      <div className={`${b.mock} ${b.story}`}><JourneyLogo letters={letters} compact tone="lime" /><p className={b.display}>{line("checkup")}</p><p className={b.label}>{business.name}</p></div>
      <span>Story or reel cover</span>
    </li>
  </ul>;
}
