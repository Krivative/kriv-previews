import Link from "next/link";
import type { CSSProperties } from "react";
import type { SiteData } from "@/lib/site-schema";
import { pageHref } from "@/lib/site-pages";
import { addOns } from "@/offers/ph-local";
import { dentalJourney } from "@/stories/dental-journey";
import { Ribbon, conceptNotice } from "./Chrome";
import { JourneyLogo, logoWords } from "./JourneyLogo";
import { OFFER_FONTS } from "./OfferPage";
import s from "./sections.module.css";
import o from "./offer.module.css";
import j from "./journey.module.css";
import b from "./brandkit.module.css";

// A concept brand kit for a journey lead (preview-only): the redrawn logo on
// every ground, the colours, the type, and how they would look on the places a
// clinic shows up. It shows what the branding kit would feel like in use. Every
// piece is a proposal for the clinic to approve; nothing here is the clinic's
// official material, and no contact detail is invented.

const colours = [
  { name: "Night navy", hex: "#0D141C", use: "Ground" },
  { name: "Deep slate", hex: "#16222E", use: "Cards and panels" },
  { name: "Soft white", hex: "#ECEEF1", use: "Text and teeth" },
  { name: "Fresh lime", hex: "#E7FA78", use: "Accent and smile" },
  { name: "Sea teal", hex: "#2B7F92", use: "Light backgrounds" },
];
const line = (id: string) => dentalJourney.find((step) => step.id === id)?.title ?? "";

export function BrandKitPage({ site }: { site: SiteData }) {
  const { business } = site;
  const { letters, ring } = logoWords(site);
  const kit = addOns[0];
  const place = business.address.city.startsWith("[") ? business.category : `${business.category} in ${business.address.city}`;
  return <div className={`${s.site} ${o.root} ${j.root}`} lang={site.lang}>
    <link rel="stylesheet" href={OFFER_FONTS} precedence="fonts" />
    <Ribbon site={site} />
    <a className={s.skipLink} href="#main-content">Skip to content</a>
    <header className={`${o.top} ${j.top}`}>
      <span className={j.name}><JourneyLogo letters={letters} compact />{business.name}</span>
      <nav aria-label="Pages" className={j.nav}><Link href={pageHref(site)} prefetch={false}>Back to the story</Link></nav>
    </header>
    <main id="main-content" className={o.main}>
      <section className={o.intro}>
        <p className={o.eyebrow}>Concept brand kit</p>
        <h1>One look, <em>everywhere the clinic appears.</em></h1>
        <p className={o.lead}>This is how a branding kit would feel in use for {business.name}: the clinic&apos;s own logo redrawn, with the colours, type and ready-made pieces that go with it. Every piece is a proposal for the clinic to approve.</p>
      </section>

      <section className={o.block} aria-labelledby="kit-logo">
        <p className={o.eyebrow}>Logo</p>
        <h2 id="kit-logo">The clinic&apos;s logo, <em>redrawn.</em></h2>
        <p>It keeps what the clinic drew: three teeth carrying its letters, the line beneath, the toothbrush, the ring and the name around it. The same drawing works on dark, on colour and on white.</p>
        <ul className={b.grounds}>
          <li className={b.onNavy}><JourneyLogo letters={letters} ring={ring} /><span>On navy</span></li>
          <li className={b.onLime}><JourneyLogo letters={letters} ring={ring} tone="lime" /><span>On lime</span></li>
          <li className={b.onLight}><JourneyLogo letters={letters} ring={ring} tone="light" /><span>On white</span></li>
        </ul>
        <ul className={b.small}>
          <li><span className={b.lockup}><JourneyLogo letters={letters} compact /><strong>{business.name}</strong></span><span>Horizontal, for headers</span></li>
          <li><span className={b.icon}><JourneyLogo letters={letters} compact /></span><span>Icon, for small spaces</span></li>
        </ul>
      </section>

      <section className={o.block} aria-labelledby="kit-colour">
        <p className={o.eyebrow}>Colour</p>
        <h2 id="kit-colour">Five colours, <em>each with a job.</em></h2>
        <ul className={b.swatches}>
          {colours.map((c) => <li key={c.hex}><i style={{ "--c": c.hex } as CSSProperties} /><strong>{c.name}</strong><code>{c.hex}</code><span>{c.use}</span></li>)}
        </ul>
      </section>

      <section className={o.block} aria-labelledby="kit-type">
        <p className={o.eyebrow}>Type</p>
        <h2 id="kit-type">Three typefaces, <em>three voices.</em></h2>
        <ul className={b.type}>
          <li><span>Headlines / Lexend Zetta</span><p className={b.display}>{line("smile")}</p></li>
          <li><span>Reading / Manrope</span><p className={b.body}>{dentalJourney[1].narration}</p></li>
          <li><span>Labels / JetBrains Mono</span><p className={b.label}>Chapter 6 / The check-up</p></li>
        </ul>
      </section>

      <section className={o.block} aria-labelledby="kit-use">
        <p className={o.eyebrow}>In use</p>
        <h2 id="kit-use">The same look <em>on every screen.</em></h2>
        <p>Mock-ups only. The words come from the story on the sample website; contact details stay as placeholders until the clinic confirms them.</p>
        <ul className={b.media}>
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
          <li>
            <div className={`${b.mock} ${b.card}`}><span className={b.lockup}><JourneyLogo letters={letters} compact tone="light" /><strong>{business.name}</strong></span><p>[DENTIST NAME]<br />{business.phoneDisplay ?? "[CLINIC PHONE]"}<br />{business.address.line1}</p></div>
            <span>Appointment card</span>
          </li>
          <li>
            <div className={`${b.mock} ${b.app}`}><span className={b.icon}><JourneyLogo letters={letters} compact /></span></div>
            <span>Browser and app icon</span>
          </li>
        </ul>
      </section>

      <section className={o.block} aria-labelledby="kit-files">
        <p className={o.eyebrow}>The kit</p>
        <h2 id="kit-files">What a {kit.name.toLowerCase()} <em>includes.</em></h2>
        <ul className={o.ticks}>{kit.includes.map((item) => <li key={item}>{item}</li>)}</ul>
        <p className={o.small}>This page is a preview of the look, not the finished files. The final kit is made with the clinic and approved by it.</p>
      </section>
    </main>
    <footer className={o.foot}>
      <p>{business.name}. Concept brand kit.</p>
      <p>{conceptNotice(business.name)}</p>
    </footer>
  </div>;
}
