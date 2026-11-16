import Link from "next/link";
import type { SiteData } from "@/lib/site-schema";
import { pageHref } from "@/lib/site-pages";
import { addressText, phoneText } from "@/lib/us-format";
import { journeyLores, journeyStyle } from "@/stories/journey-style";
import { beatEffects, soundRoom } from "@/stories/story-sound";
import { bestSellers, peso, shoeCare, sneakerJourney } from "@/stories/sneaker-journey";
import { AboutBlock, FaqBlock, JourneyFrame } from "./JourneyBlocks";
import { JourneyScroller } from "./JourneyScroller";
import { DvLogo, dvLogoStyle } from "./DvLogo";
import { inert } from "./inert";
import o from "./offer.module.css";
import j from "./journey.module.css";
import d from "./sneaker.module.css";

// DV Shop Cebu's home page told as a scroll journey (preview-only; `story: "sneaker-journey"`).
// The stage shows the shop's own photos, one per page of the story, instead of a drawing.
// Then the story's second half as a shelf (DV Shoe Care), a few best sellers, and the store.
// Guardrails: concept banner, inert links and buttons, no form, every fact from the shop's
// public pages (docs/leads/dv-shop-cebu/public-data.json), its photos credited to it.

function Stage() {
  return <div className={j.stage} aria-hidden="true">
    <div className={`${j.art} ${d.shots}`}>
      {sneakerJourney.map((step, n) => <figure key={step.id} className={d.shot} data-n={n} data-fit={step.fit ?? "cover"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={step.photo} alt="" loading={n < 2 ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" />
      </figure>)}
    </div>
  </div>;
}

export function ShoeCareShelf() {
  return <section className={o.block} aria-labelledby="shoe-care">
    <p className={o.eyebrow}>The other half</p>
    <h2 id="shoe-care">DV <em>Shoe Care</em></h2>
    <p>Six products from DV Shop&apos;s own line, at the prices on dvshopcebu.com.</p>
    <ul className={d.shelf}>
      {shoeCare.map((item) => <li key={item.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.photo} alt={item.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        <h3>{item.name}</h3>
        <p className={d.meta}>{item.size} · <b>{peso(item.price)}</b></p>
        <p>{item.use}</p>
        <a className={d.ghost} {...inert}>View in the shop</a>
      </li>)}
    </ul>
  </section>;
}

function BestSellers() {
  return <section className={o.block} aria-labelledby="best-sellers">
    <p className={o.eyebrow}>The legit half</p>
    <h2 id="best-sellers">A few <em>best sellers</em></h2>
    <p>From the shop&apos;s own best-seller list, with today&apos;s prices. 832 products across Nike, Air Jordan, New Balance, On, Onitsuka Tiger, Adidas, Puma, Converse, Asics, Salomon and Golden Goose, plus pickleball, slides, apparel and POP MART.</p>
    <ul className={d.pairs}>
      {bestSellers.map((pair) => <li key={pair.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pair.photo} alt={pair.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        <h3>{pair.name}</h3>
        <p className={d.meta}><b>{peso(pair.price)}</b></p>
      </li>)}
    </ul>
  </section>;
}

export function StoreBlock({ site }: { site: SiteData }) {
  const { business } = site;
  return <section className={o.block} aria-labelledby="visit">
    <p className={o.eyebrow}>Visit</p>
    <h2 id="visit">Celadon Town, <em>Lapu-Lapu City</em></h2>
    <div className={d.store}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://dvshopcebu.com/cdn/shop/files/IMG_5502.jpg?width=1200" alt="The DV Shop Cebu storefront, with the DV cafe sign outside" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      <dl className={o.meta}>
        <div><dt>Address</dt><dd>{addressText(business.address)}</dd></div>
        {business.hours.map((h) => <div key={h.days}><dt>{h.days}</dt><dd>{h.time}</dd></div>)}
        <div><dt>Phone</dt><dd>{phoneText(business)}</dd></div>
        {business.email ? <div><dt>Email</dt><dd>{business.email}</dd></div> : null}
        <div><dt>Also inside</dt><dd>DV Cafe, coffee in the store</dd></div>
        <div><dt>Pay with</dt><dd>Cash on delivery nationwide, card, e-wallets, BPI, GCash, Maya, SPayLater</dd></div>
        <div><dt>Ships</dt><dd>Nationwide and worldwide</dd></div>
        <div><dt>Carousell</dt><dd><a {...inert}>Rated 5.0 from 75 reviews</a></dd></div>
        <div><dt>Facebook</dt><dd><a {...inert}>DV Shop Cebu, 22K followers</a></dd></div>
        <div><dt>Instagram</dt><dd><a {...inert}>@dvshopcebu, 5,954 followers</a></dd></div>
      </dl>
    </div>
  </section>;
}

export function SneakerSite({ site }: { site: SiteData }) {
  const look = journeyStyle(site);
  const label = journeyLores[look.lore];
  const logo = dvLogoStyle(look.seed);
  const nav = <>
    <a href="#journey-fresh">The story</a>
    <a href="#shoe-care">Shoe Care</a>
    <a href="#best-sellers">Best sellers</a>
    <a href="#visit">Visit</a>
    <Link href={pageHref(site, "brand-kit")} prefetch={false}>Brand revamp</Link>
  </>;
  return <JourneyFrame site={site} nav={nav}>
    <JourneyScroller id={site.slug} className={`${j.journey} ${d.journey}`} voiceClassName={j.voice} cueClassName={j.cue} defaultVoice={false} sound={soundRoom(look.sound, "sneaker")}>
      <p className={j.crest}><span><DvLogo style={logo} compact /><b>DV SHOP CEBU</b></span></p>
      <ol className={j.dots} aria-label="Pages of the story">
        {sneakerJourney.map((step, n) => <li key={step.id}><a href={`#journey-${step.id}`} aria-label={`${label(n + 1, sneakerJourney.length, step.chapter).lead}: ${step.chapter}`} /></li>)}
      </ol>
      <Stage />
      <div className={j.steps}>
        {sneakerJourney.map((step, n) => <section key={step.id} id={`journey-${step.id}`} className={j.step} data-journey-step="" data-sfx={beatEffects.sneaker[step.id]} aria-labelledby={`journey-${step.id}-title`}>
          <div className={j.words}>
            <p className={o.eyebrow}><b>{label(n + 1, sneakerJourney.length, step.chapter).lead}</b> / {step.chapter}</p>
            {n === 0 ? <>
              <p className={j.clinic}>{site.hero.eyebrow ?? site.business.category}</p>
              <h1 id={`journey-${step.id}-title`}>{step.title}</h1>
            </> : <h2 id={`journey-${step.id}-title`}>{step.title}</h2>}
            <p className={j.narration} data-narration="">{step.narration}</p>
            {n === 0 ? <p className={j.hint}>Scroll to begin <span aria-hidden="true">↓</span></p> : null}
            {n === sneakerJourney.length - 1 ? <p className={o.actions}><a className={o.button} {...inert}>Shop the pairs <span aria-hidden="true">+</span></a><a href="#shoe-care">See DV Shoe Care</a></p> : null}
          </div>
        </section>)}
      </div>
    </JourneyScroller>
    <div className={o.main}>
      <ShoeCareShelf />
      <BestSellers />
      <AboutBlock site={site} />
      <StoreBlock site={site} />
      <FaqBlock site={site} />
      <p className={d.credit}>Photos, products and prices: DV Shop Cebu (dvshopcebu.com). Follower counts as shown on the shop&apos;s Facebook and Instagram pages on 17 November 2026.</p>
    </div>
  </JourneyFrame>;
}
