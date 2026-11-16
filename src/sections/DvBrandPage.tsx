import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import { pageHref } from "@/lib/site-pages";
import { sneakerJourney, sneakerLook, sneakerPhotos } from "@/stories/sneaker-journey";
import { JourneyFrame } from "./JourneyBlocks";
import { DopMark, DvLogo, allDvLogoStyles, dvLogoStyle, type DvLogoStyle } from "./DvLogo";
import o from "./offer.module.css";
import d from "./sneaker.module.css";

// Two concept pages for DV Shop Cebu (preview-only):
//  - "Brand revamp": the shop's own badge, redrawn close to the original, with the randomizer's pick
//    and its siblings, on every ground, plus the colours and type. A proposal for the DV Shop team.
//  - "Dop-": Kriv's personal brand concept for the owner, in the same family as the badge, with a mock
//    Instagram profile. The handle is a SUGGESTION, not his account; nothing is posted anywhere.

const name = (s: DvLogoStyle) => `${s.ring} ring, ${s.letters} letters${s.accent === "none" ? "" : `, ${s.accent}`}`;
const same = (a: DvLogoStyle, b: DvLogoStyle) => a.ring === b.ring && a.letters === b.letters;

function Nav({ site, current }: { site: SiteData; current: "brand-kit" | "dop" }) {
  return <>
    <Link href={pageHref(site)} prefetch={false}>The story</Link>
    <Link href={pageHref(site, "brand-kit")} prefetch={false} aria-current={current === "brand-kit" ? "page" : undefined}>Brand revamp</Link>
    <Link href={pageHref(site, "dop")} prefetch={false} aria-current={current === "dop" ? "page" : undefined}>Dop-</Link>
  </>;
}

export function DvBrandPage({ site }: { site: SiteData }) {
  const look = sneakerLook(site);
  const pick = dvLogoStyle(look.seed);
  const { theme } = look;
  const colours = [
    { name: "Black", hex: "#0B0B0B", use: "The disc, as on the shop's badge" },
    { name: "Paper", hex: "#F4F1EC", use: "Ring, letters and light grounds" },
    { name: "Ground", hex: theme.bg, use: "The story's ground" },
    { name: "Accent", hex: theme.accent, use: "Volt: the fresh-pair highlight" },
    { name: "Navy", hex: "#1D3686", use: "Kept from dvshopcebu.com" },
  ];
  return <JourneyFrame site={site} nav={<Nav site={site} current="brand-kit" />}>
    <div className={o.main}>
      <section className={o.intro}>
        <p className={o.eyebrow}>Concept brand revamp</p>
        <h1>Same badge. <em>Sharper finish.</em></h1>
        <p className={o.lead}>DV Shop Cebu&apos;s own logo is a black disc in a white ring, with outlined D and V letters, &ldquo;SHOP CEBU&rdquo; and &ldquo;EST.2020&rdquo;. The revamp keeps all of it and only refines the finish. The story&apos;s randomizer picked one; its siblings are below.</p>
      </section>

      <section className={o.block} aria-labelledby="kit-pick">
        <p className={o.eyebrow}>The randomizer&apos;s pick</p>
        <h2 id="kit-pick">On every <em>ground</em></h2>
        <ul className={d.grounds}>
          <li><DvLogo style={pick} /><span>On the story&apos;s ground</span></li>
          <li><DvLogo style={pick} tone="accent" /><span>On the accent</span></li>
          <li><DvLogo style={pick} tone="light" /><span>On paper</span></li>
        </ul>
        <p>Pick: {name(pick)}.</p>
      </section>

      <section className={o.block} aria-labelledby="kit-siblings">
        <p className={o.eyebrow}>Siblings</p>
        <h2 id="kit-siblings">Nine finishes, <em>one badge</em></h2>
        <ul className={d.variants}>
          {allDvLogoStyles.map((v) => same(v, pick) ? pick : v).map((v) => <li key={name(v)} data-picked={same(v, pick) ? "" : undefined}><DvLogo style={v} /><span>{name(v)}{same(v, pick) ? " (pick)" : ""}</span></li>)}
        </ul>
        <figure className={o.block}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sneakerPhotos.logo} alt="DV Shop Cebu's current logo, from dvshopcebu.com" width={160} height={160} referrerPolicy="no-referrer" />
          <figcaption>For comparison: the current logo, from dvshopcebu.com.</figcaption>
        </figure>
      </section>

      <section className={o.block} aria-labelledby="kit-colours">
        <p className={o.eyebrow}>Colours and type</p>
        <h2 id="kit-colours">Black and white, <em>one accent</em></h2>
        <ul className={d.swatches}>{colours.map((c) => <li key={c.name}><i style={{ background: c.hex }} /><span><b>{c.name}</b> <code>{c.hex}</code><br />{c.use}</span></li>)}</ul>
        <p>Type: {theme.displayName} for headlines, {theme.bodyName} for text. The shop&apos;s site uses Inter and Bricolage Grotesque today; either pair works with the badge.</p>
      </section>

      <p className={d.credit}>A concept by KRIV for the DV Shop team to approve. It is not DV Shop Cebu&apos;s official mark.</p>
    </div>
  </JourneyFrame>;
}

export function DopPage({ site }: { site: SiteData }) {
  const pick = dvLogoStyle(sneakerLook(site).seed);
  const posts = [
    { photo: sneakerJourney[0].photo, alt: "A fresh pair" },
    { text: "Legit lang, always." },
    { photo: sneakerPhotos.cafe, alt: "Sneakers and coffee" },
    { text: "From Clicks to Kicks." },
    { photo: sneakerPhotos.storefront, alt: "The store" },
    { text: "Keep them fresh." },
  ];
  return <JourneyFrame site={site} nav={<Nav site={site} current="dop" />}>
    <div className={o.main}>
      <section className={o.intro}>
        <p className={o.eyebrow}>Bonus concept</p>
        <h1>Dop-</h1>
        <p className={o.lead}>A personal mark for the person behind DV Shop Cebu, from the same family as the shop&apos;s badge: the disc, the ring, and a dash that says there&apos;s more coming.</p>
      </section>
      <section className={o.block} aria-labelledby="dop-mark">
        <p className={o.eyebrow}>The mark</p>
        <h2 id="dop-mark">Dop- <em>on every ground</em></h2>
        <ul className={d.grounds}>
          <li><DopMark style={pick} /><span>On the story&apos;s ground</span></li>
          <li><DopMark style={pick} tone="accent" /><span>On the accent</span></li>
          <li><DopMark style={pick} tone="light" /><span>On paper</span></li>
        </ul>
      </section>
      <section className={o.block} aria-labelledby="dop-profile">
        <p className={o.eyebrow}>How it could look</p>
        <h2 id="dop-profile">A profile, <em>mocked up</em></h2>
        <p>A drawing of a profile page. The handle is a suggestion only; it is not an existing account, and nothing is posted anywhere.</p>
        <div className={d.phone} aria-label="Mock-up of a social profile">
          <div className={d.profile}>
            <DopMark style={pick} />
            <div><p className={d.handle}>@dop.dash <small>(suggested)</small></p><p className={d.bio}>Sneakers, coffee and Cebu. The person behind DV Shop Cebu. Est. 2020.</p></div>
          </div>
          <div className={d.grid3}>
            {posts.map((p, n) => <div key={n} className={d.post}>
              {p.photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.photo} alt={p.alt} loading="lazy" referrerPolicy="no-referrer" />
                : p.text}
            </div>)}
          </div>
        </div>
      </section>
      <p className={d.credit}>A concept by KRIV. Photos: DV Shop Cebu. Shown privately; nothing here changes any real account.</p>
    </div>
  </JourneyFrame>;
}
