import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import { pageHref } from "@/lib/site-pages";
import { TRIAL_DAYS, annualPay, annualPlans, annualSaving, audiences, crm, decisionWindows, everyPlan, fill, php, totalMonths } from "@/offers/ph-local";
import { inert } from "./inert";
import { shoeCare } from "@/stories/sneaker-journey";
import { JourneyFrame } from "./JourneyBlocks";
import o from "./offer.module.css";
import d from "./sneaker.module.css";

// KRIV's offer for DV Shop Cebu (preview-only), written to Dop Dop, Kriv's childhood friend.
// Three parts (Kriv, 2026-11-17): the trial, the plan, and the introduction ask. Every price and
// window comes from src/offers/ph-local.ts; nothing is typed by hand. Work with no price in
// ph-local (listing rewrites, TikTok, the Shoe Care campaign, the jingle and rap) is part of the
// free 14 days only. The ask is an introduction: no reward, no pressure, no obligation.

const days = (w: (typeof decisionWindows)[number]) => (w.toDay ? `Days ${w.fromDay} to ${w.toDay}` : `From day ${w.fromDay}`);
// The two services the 14 days lead into: the site (trust copy, product cards, listings) and the content.
const continues = ["Website", "Content creation"].map((name) => annualPlans.find((p) => p.name === name)!);

const fixes = [
  { name: "Trust copy that reads as clean as the pairs", body: "Spelling across the footer, menus and product titles, and one clear promise: the homepage and the refund policy saying the same thing." },
  { name: "Your store, front and centre", body: "Address, hours, phone and socials on the homepage, and the Celadon Town and DV Cafe cards each going to their own page." },
  { name: "Product cards that sell", body: "One clear title per pair, the right button for sold-out items, and sale badges that show the old price." },
  { name: "Five listings, rewritten", body: "Samba OG \"Cloud White\", Dunk Low \"Panda\", AJ1 Low OG \"Chicago\", On Cloudtilt \"Black Ivory\" and the DV Shoe Cleaning Kit, with their real names, SKUs and prices." },
  { name: "Replies that answer before they're asked", body: "Ready replies for cash on delivery, \"legit ba?\", sizing, stock and shipping, in your voice. You fill in the parts only you can answer." },
  { name: "Fourteen days of content", body: "A calendar for Facebook, Instagram and TikTok, from the store tour to a 60-second clean. You approve every post; nothing goes out without you." },
  { name: "DV Shoe Care, with a story", body: `"Keep them fresh": all ${shoeCare.length} products, from the ₱90 wipes to the ₱420 kit, given their own campaign.` },
  { name: "A DV jingle and a rap track", body: "Original lyrics written for the shop, \"Clicks to Kicks\". The audio is made only after you've read the words." },
];

export function DvOfferPage({ site }: { site: SiteData }) {
  const nav = <>
    <Link href={pageHref(site)} prefetch={false}>The story</Link>
    <Link href={pageHref(site, "brand-kit")} prefetch={false}>Brand revamp</Link>
    <Link href={pageHref(site, "dop")} prefetch={false}>Dop-</Link>
  </>;
  return <JourneyFrame site={site} nav={nav}>
    <div className={o.main}>
      <section className={o.intro}>
        <p className={o.eyebrow}>For Dop Dop, from Kriv</p>
        <h1>Your {TRIAL_DAYS} days, <em>on us.</em></h1>
        <p className={o.lead}>We go way back, so this one&apos;s on me: {TRIAL_DAYS} days of KRIV&apos;s work for DV Shop Cebu, free. Everything on these pages was built from what the shop already shows the world. Imagine what we make together.</p>
      </section>

      <section className={o.block} aria-labelledby="trial">
        <p className={o.eyebrow}>The trial</p>
        <h2 id="trial">What comes <em>with it</em></h2>
        <ul className={o.cards}>
          {everyPlan.map((item) => <li key={item.name}><h3>{item.name}</h3><p>{fill(item.body, { ...audiences.general, Client: "DV Shop Cebu", client: "DV Shop Cebu" })}</p></li>)}
        </ul>
      </section>

      <section className={o.block} aria-labelledby="plan">
        <p className={o.eyebrow}>The plan</p>
        <h2 id="plan">What the first 14 days <em>fix</em></h2>
        <ol className={o.cards}>
          {fixes.map((f) => <li key={f.name}><h3>{f.name}</h3><p>{f.body}</p></li>)}
        </ol>
        <p>All of it is part of the free {TRIAL_DAYS} days.</p>
      </section>

      <section className={o.block} aria-labelledby="day-15">
        <p className={o.eyebrow}>After the trial</p>
        <h2 id="day-15">Day 15: <em>one decision</em></h2>
        <p>Keep what helped on the annual plan, or simply stop. Stopping costs nothing. Deciding during the trial adds free months:</p>
        <ul className={o.cards}>
          {decisionWindows.map((w) => <li key={w.fromDay}><h3>{days(w)}</h3><p>{w.freeMonths ? `${totalMonths(w)} months for the price of ${crm.baseMonths}: ${w.freeMonths} free month${w.freeMonths > 1 ? "s" : ""}.` : `${crm.baseMonths} months for the price of ${crm.baseMonths}. No free months.`}</p></li>)}
        </ul>
        <p>The two services the 14 days lead into, at the rates on KRIV&apos;s Philippine price list:</p>
        <ul className={o.cards}>
          {continues.map((p) => <li key={p.name}><h3>{p.name}</h3><p>{php(p.monthly)} a month, paid once a year: {php(annualPay(p))}. Decide by day 5 and it covers {totalMonths(decisionWindows[0])} months, a saving of {php(annualSaving(p, decisionWindows[0]))}.</p></li>)}
        </ul>
      </section>

      <section className={o.block} aria-labelledby="favour">
        <p className={o.eyebrow}>One small favour</p>
        <h2 id="favour">Only if <em>it helps</em></h2>
        <p>If these two weeks help the shop, I&apos;d love an introduction to one person you know who&apos;d value this kind of work. That&apos;s the whole ask. No pressure, no obligation, and the trial is yours either way.</p>
        <p className={o.actions}><a className={o.button} {...inert}>Start the 14 days <span aria-hidden="true">+</span></a><Link href={pageHref(site)} prefetch={false}>Back to the story</Link></p>
      </section>

      <p className={d.credit}>Prices from KRIV&apos;s Philippine rates. Photos and products: DV Shop Cebu. A private page; nothing here is sent or published.</p>
    </div>
  </JourneyFrame>;
}
