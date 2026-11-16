import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteData } from "@/lib/site-schema";
import { pageHref } from "@/lib/site-pages";
import { addressText, phoneText } from "@/lib/us-format";
import { BookButton, mark } from "./JourneyBlocks";
import { inert } from "./inert";
import { SocialShowcase } from "./JourneySocial";
import { JourneyLogo, logoWords } from "./JourneyLogo";
import { levelTwoVoice } from "@/stories/clinic-level-two";
import { JourneyScroller } from "./JourneyScroller";
import o from "./offer.module.css";
import j from "./journey.module.css";
import c from "./clinic-journey.module.css";

// Level two of a story site's home page (preview-only). The story of the tooth
// is the why; this is the how: every part of the practice as a stop on one
// connected map. The map stays in view; each stop lights its place on it and
// shows what it leads to. It scrolls freely (no hold), because the stops carry
// lists and questions people need to read at their own pace. Each stop has one
// recorded line, played when the stop comes into view and stopped when the
// visitor moves on; it follows the story's narration on/off setting. All words come
// from the lead record, so placeholders stay placeholders.

type Stop = { id: string; name: string; title: ReactNode; body: ReactNode };

export function ClinicJourney({ site }: { site: SiteData }) {
  const { business } = site;
  const { letters, ring } = logoWords(site);
  const stops: Stop[] = [];
  if (site.services) stops.push({ id: "services", name: "Services", title: mark(site.services.title ?? "Our *services*"), body: <>
    {site.services.intro ? <p className={j.narration} data-narration="">{site.services.intro}</p> : null}
    <ul className={c.list}>{site.services.items.map((item) => <li key={item.name}><strong>{item.name}</strong>{item.blurb ? <span>{item.blurb}</span> : null}</li>)}</ul>
  </> });
  if (site.about) stops.push({ id: "about", name: "The team", title: mark(site.about.title ?? `About *${business.name}*`), body: <>
    <p className={j.narration} data-narration="">{site.about.body}</p>
    {site.about.sections?.length ? <ul className={c.list}>{site.about.sections.map((part) => <li key={part.title}><strong>{part.title}</strong><span>{part.body}</span></li>)}</ul> : null}
  </> });
  if (site.custom) stops.push({ id: "book", name: "Booking", title: mark(site.custom.title), body: <>
    {site.custom.body ? <p className={j.narration} data-narration="">{site.custom.body}</p> : null}
    <ol className={`${c.list} ${c.numbered}`}>{site.custom.items.map((item) => <li key={item.name}><strong>{item.name}</strong>{item.blurb ? <span>{item.blurb}</span> : null}</li>)}</ol>
  </> });
  stops.push({ id: "visit", name: "The visit", title: mark(site.close?.headline ?? "Plan your *visit*"), body: <>
    {site.close?.sub ? <p className={j.narration} data-narration="">{site.close.sub}</p> : null}
    <dl className={`${o.meta} ${c.meta}`}>
      <div><dt>Address</dt><dd>{addressText(business.address)}</dd></div>
      <div><dt>Phone</dt><dd>{phoneText(business)}</dd></div>
      {business.email ? <div><dt>Email</dt><dd>{business.email}</dd></div> : null}
      {business.socials.facebook ? <div><dt>Facebook</dt><dd><a {...inert}>The clinic&apos;s Facebook page</a></dd></div> : null}
      {business.hours.map((h) => <div key={h.days}><dt>{h.days}</dt><dd>{h.time}</dd></div>)}
    </dl>
    <p className={o.actions}><BookButton site={site} /></p>
  </> });
  stops.push({ id: "social", name: "On social media", title: <>The same look <em>on every screen</em></>, body: <>
    <p className={j.narration} data-narration="">The website is one room of the clinic. Its social pages are the others. This is how they would look in the same brand, so a patient knows it is the same clinic wherever they meet it.</p>
    <SocialShowcase site={site} />
    <p className={c.leads}>Mock-ups only. <Link href={pageHref(site, "brand-kit")} prefetch={false}>See the full concept brand kit</Link></p>
  </> });
  if (site.faqs?.length) stops.push({ id: "faq", name: "Questions", title: <>Good to <em>know</em></>, body: <div className={j.faq}>
    {site.faqs.map((f) => <details key={f.q}><summary>{f.q}<span aria-hidden="true">+</span></summary><p>{f.a}</p></details>)}
  </div> });

  // The map: the clinic at the centre, one place per stop around it, joined in visiting order.
  const place = (n: number) => { const a = (n / stops.length) * Math.PI * 2 - Math.PI / 2; return { x: 200 + Math.cos(a) * 138, y: 200 + Math.sin(a) * 138 }; };

  return <JourneyScroller id={`${site.slug}:clinic`} className={`${j.journey} ${c.level}`} voiceClassName={j.voice} cueClassName={j.cue} locked={false}>
    <p className={j.crest}><span><JourneyLogo letters={letters} compact /><b>{ring}</b></span></p>
    <ol className={j.dots} aria-label="Stops inside the clinic">
      <li><a href="#inside" aria-label="Level two: inside the clinic" /></li>
      {stops.map((stop, n) => <li key={stop.id}><a href={`#${stop.id}`} aria-label={`Stop ${n + 1}: ${stop.name}`} /></li>)}
    </ol>
    <div className={j.stage} aria-hidden="true">
      <svg viewBox="0 0 400 400" className={`${j.art} ${c.map}`}>
        <circle className={j.orbit} cx="200" cy="200" r="184" />
        <path className={c.route} d={`${stops.map((_, n) => `${n ? "L" : "M"}${place(n).x.toFixed(1)} ${place(n).y.toFixed(1)}`).join(" ")} Z`} />
        <g className={c.hub} data-journey-scene="">
          <circle cx="200" cy="200" r="62" />
          <text x="200" y="197" textAnchor="middle">{letters}</text>
          <text className={c.small} x="200" y="218" textAnchor="middle">the clinic</text>
        </g>
        {stops.map((stop, n) => { const p = place(n); const next = place((n + 1) % stops.length); return <g key={stop.id} className={c.place} data-journey-scene="">
          <line className={c.spoke} x1="200" y1="200" x2={p.x} y2={p.y} />
          <line className={c.leg} x1={p.x} y1={p.y} x2={next.x} y2={next.y} />
          <circle cx={p.x} cy={p.y} r="30" />
          <text className={c.count} x={p.x} y={p.y + 5} textAnchor="middle">{n + 1}</text>
          <text className={c.small} x={p.x} y={p.y + (p.y < 200 ? -40 : 50)} textAnchor="middle">{stop.name}</text>
        </g>; })}
      </svg>
    </div>
    <div className={j.steps}>
      <section id="inside" className={j.step} data-journey-step="" data-audio={levelTwoVoice.inside} aria-labelledby="inside-title">
        <div className={j.words}>
          <p className={o.eyebrow}><b>Level two</b> / Inside the clinic</p>
          <figure className={j.logoFigure}>
            <JourneyLogo letters={letters} ring={ring} />
            <figcaption>A concept redraw of the clinic&apos;s logo by KRIV, for the clinic to approve. <Link href={pageHref(site, "brand-kit")} prefetch={false}>See the concept brand kit</Link>.</figcaption>
          </figure>
          <h2 id="inside-title">{mark(site.hero.headline)}</h2>
          <p className={j.narration} data-narration="">The story of the tooth is the why. This part is the how: each part of the clinic, and how one leads to the next.</p>
          <p className={j.note}>{site.hero.sub}</p>
          <p className={c.leads}>Leads to <span aria-hidden="true">→</span> <a href={`#${stops[0].id}`}>{stops[0].name}</a></p>
        </div>
      </section>
      {stops.map((stop, n) => <section key={stop.id} id={stop.id} className={j.step} data-journey-step="" data-audio={levelTwoVoice[stop.id]} aria-labelledby={`${stop.id}-title`}>
        <div className={`${j.words} ${c.words}`}>
          <p className={o.eyebrow}><b>Stop {n + 1} of {stops.length}</b> / {stop.name}</p>
          <h2 id={`${stop.id}-title`}>{stop.title}</h2>
          {stop.body}
          {stops[n + 1] ? <p className={c.leads}>Leads to <span aria-hidden="true">→</span> <a href={`#${stops[n + 1].id}`}>{stops[n + 1].name}</a></p> : <p className={c.leads}>The ride ends here. <a href="#journey-smile">Back to the story</a></p>}
        </div>
      </section>)}
    </div>
  </JourneyScroller>;
}
