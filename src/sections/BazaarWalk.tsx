"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LIVE_SELLER_COMMISSION_NOTE, addOns, crm, fill, liveSeller, monthlyServices, php, type Audience } from "@/offers/ph-local";
import { stallKinds, type Bazaar, type ChibiCostume, type StallKind } from "@/stories/bazaar";
import b from "./bazaar.module.css";
import { shapedScene } from "@/lib/scene-shapes";
import sh from "@/lib/scene-shapes.module.css";

/** Each bazaar's painting; the Road Bazaar is the Merchant's Road stop 3. */
const bazaarScene = (name: string) => name === "road-bazaar" ? "/for/scenes/merchants-road/03" : `/for/scenes/bazaars/${name}`;

// Part two of a story: a walk through the bazaar with KRIV, Street View style (Kriv, 2026-11-16).
// The visitor walks a road; each of KRIV's six services stands at its own stall a few steps past the one
// before, and the Build stall waits about a kilometre ahead. "Skip the bazaar" jumps straight to the prices.
// The market's name and stall names come from the randomizer (look.bazaar); every price from ph-local.ts.
// Decoration over the same facts the words state. Reduced motion: no drift, no bobbing.

const monthly = (name: string) => monthlyServices.find((s) => s.name === name)?.monthly ?? 0;
const yearlyOf: Record<StallKind, number> = {
  website: monthly("Website"), content: monthly("Content creation"), "live-seller": monthly("AI live seller"), crm: crm.promoMonthly, agent: addOns[1].price, voice: 0,
};
const service: Record<StallKind, string> = { website: "Website", content: "Content creation", "live-seller": "AI live seller", crm: "CRM and automations", agent: "AI chat agent", voice: "AI voice agent" };
const pitch: Record<StallKind, string> = {
  website: "Every site starts from the job it has to do. Here are four we built, each a different version.",
  content: "The brand kit for {client}, already posted on Instagram and Facebook, and printed on the things {customers} hold.",
  "live-seller": "Our chibi takes the stage and sells. Behind it, AIs work together to sell day and night.",
  crm: "Most businesses do not lose customers at the start. They lose them in the gaps: a late reply, no follow-up, a booking nobody reminded. The CRM closes each gap.",
  agent: "On Messenger, Instagram and the website, it answers the usual questions in seconds, asks what the customer needs and books them in. Judgement calls go to a person.",
  voice: "Calls after hours or while everyone is busy still get answered, in a natural voice. It answers, books, confirms by text, and passes urgent calls to {your} team.",
};
/** "How it's built", for those who want the depth. */
const built: Record<StallKind, string[]> = {
  website: ["Designed for phones first, in {your} own look", "Pages planned from {your} customers' questions", "Search setup and Google Business Profile", "Forms and booking that feed straight into the CRM", "Kept up to date by KRIV"],
  content: ["A brand kit: logo, colours, type and voice", "A content plan for each month", "Posts and captions {client} approves first", "Scheduling on every channel {client} uses", "The branding carried onto merch and print"],
  "live-seller": ["KRIV takes in the items and builds the catalog", "The AI is briefed with approved details and wording", "An AI live manager logs each order as it is claimed", "Buyers are contacted in claim order; a back-out passes to the next", "Paid items leave the list automatically", "A KRIV team member watches over it"],
  crm: ["Every inquiry from Facebook, Instagram, the website and calls in one place", "An instant first reply, then a person follows up", "A pipeline that shows where each inquiry stands", "Follow-ups by email and SMS that send themselves", "Booking with reminders; a no-show gets a rebook message", "A review request after each visit", "Win-back messages for customers who have gone quiet", "A dashboard of what came in and where people dropped"],
  agent: ["Messenger, Instagram, website chat and WhatsApp", "Trained on information and wording {client} approves", "Asks the questions {your} team would ask", "Books straight into the calendar", "Hands off to a person when judgement is needed", "Every chat saved to the CRM"],
  voice: ["Answers in English or Filipino, in a natural voice", "Follows a script and answers {client} approves", "Books, reschedules and confirms by text", "Passes urgent calls to a person", "Every call summarised in the CRM"],
};
/** The gaps, as a sum: round example numbers, labelled as such on the page. */
const gapMath = [
  { label: "Left to chance", cells: [["100", "inquiries"], ["40%", "get a reply in time"], ["50%", "book"], ["60%", "show up"]], total: ["12", "customers"] },
  { label: "Followed by the CRM", cells: [["100", "inquiries"], ["90%", "answered at once"], ["50%", "book"], ["80%", "show up, reminded"]], total: ["36", "customers"] },
];
const portfolio = [
  { name: "PCO Dental Clinic", shot: "/for/portfolio/pco.webp", kind: "Clinic story site", line: "A scroll story with a voice and a cast, built to turn a visit into a booking." },
  { name: "Ivory Premier", shot: undefined as string | undefined, kind: "Aesthetic clinic", line: "A premium clinic site that presents each treatment with calm and care." },
  { name: "Philippine rates", shot: "/for/portfolio/rates.webp", kind: "Pricing walk", line: "This walk: a road of stops with a plan builder that does the maths live." },
  { name: "kriv.agency", shot: "/for/portfolio/kriv-agency.webp", kind: "Agency site", line: "A mastermind's view of a business, in ten movements, with scenes and sound." },
];
const sellerSteps = [
  "KRIV takes the items, builds the catalog and briefs the AI",
  "The AI live seller sells online, day and night",
  "An AI live manager logs every order",
  "Buyers are contacted in the order they claimed; a back-out passes to the next in the queue",
  "Paid items come off the list, and the selling carries on",
];
const agentAsks = ["“Are you open on Sunday?”", "“What are your rates?”", "“Can I book for Friday?”"];
/** Costume parts for the chibi: the world's own trade (dentist on the dental site). */
const costume: Record<ChibiCostume, { coat: string; prop: string; label: string }> = {
  dentist: { coat: "#ffffff", prop: "mirror", label: "Dr. Chibi, the dentist" },
  merchant: { coat: "#b98a52", prop: "satchel", label: "The merchant chibi" },
  producer: { coat: "#262a24", prop: "headphones", label: "The producer chibi" },
};

function Chibi({ kind }: { kind: ChibiCostume }) {
  const c = costume[kind];
  return <svg className={b.chibi} viewBox="0 0 120 150" role="img" aria-label={c.label}>
    <ellipse cx="60" cy="144" rx="34" ry="5" fill="rgba(0,0,0,0.25)" />
    <path d="M30 140 Q30 92 60 90 Q90 92 90 140 Z" fill={c.coat} stroke="currentColor" strokeWidth="3" />
    <circle cx="60" cy="56" r="36" fill="#f3d6bf" stroke="currentColor" strokeWidth="3" />
    <path d="M26 52 Q30 18 60 18 Q92 18 94 52 Q80 34 60 36 Q40 34 26 52 Z" fill="#2b2320" />
    <circle cx="47" cy="60" r="4" fill="currentColor" /><circle cx="73" cy="60" r="4" fill="currentColor" />
    <path d="M50 74 Q60 82 70 74" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    {c.prop === "mirror" ? <g><path d="M92 118 L104 84" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /><circle cx="106" cy="78" r="8" fill="var(--accent)" stroke="currentColor" strokeWidth="3" /><path d="M42 98 h36" stroke="var(--accent)" strokeWidth="4" /></g> : null}
    {c.prop === "satchel" ? <rect x="76" y="108" width="24" height="20" rx="4" fill="var(--accent)" stroke="currentColor" strokeWidth="3" /> : null}
    {c.prop === "headphones" ? <path d="M24 58 Q24 14 60 14 Q96 14 96 58" fill="none" stroke="var(--accent)" strokeWidth="6" /> : null}
  </svg>;
}

function Stall({ kind, audience, chibi, brand }: { kind: StallKind; audience: Audience; chibi: ChibiCostume; brand: string }) {
  if (kind === "website") return <div className={b.holos}>
    {portfolio.map((site, n) => <figure key={site.name} className={b.holo} style={{ "--i": n } as CSSProperties}>
      <span className={b.screen} data-shot={site.shot ? "" : undefined} style={site.shot ? { backgroundImage: `url(${site.shot})` } : undefined}><b>{site.name}</b><i /><i /><i /></span>
      <figcaption><small>{site.kind}</small>{site.line}</figcaption>
    </figure>)}
  </div>;
  if (kind === "content") return <div className={b.socials} aria-hidden="true">
    {["Instagram", "Facebook", "TikTok"].map((net, n) => <div key={net} className={b.post} style={{ "--i": n } as CSSProperties}><small>{net}</small><span><b>{brand}</b></span><i /><i /></div>)}
    <div className={b.merch}>{["Cup", "Tote", "Shirt", "Cap"].map((m) => <span key={m}>{brand}<small>{m}</small></span>)}</div>
  </div>;
  if (kind === "live-seller") return <div className={b.seller}>
    <div className={b.stage}><Chibi kind={chibi} /><span className={b.live}>Live</span></div>
    <ol className={b.steps}>{sellerSteps.map((t) => <li key={t}>{t}</li>)}</ol>
  </div>;
  if (kind === "crm") return <div className={b.math}>
    {gapMath.map((row, r) => <div key={row.label} className={b.mathRow} data-after={r ? "" : undefined}>
      <p className={b.mathLabel}>{row.label}</p>
      <p className={b.mathLine}>{row.cells.map(([v, k], n) => <span key={k}>{n ? <i aria-hidden="true">×</i> : null}<b>{v}<small>{k}</small></b></span>)}<i aria-hidden="true">=</i><b className={b.mathTotal}>{row.total[0]}<small>{row.total[1]}</small></b></p>
    </div>)}
    <p className={b.mathNote}>An example with round numbers, to show where the gaps are. Not a forecast or a promise of results.</p>
  </div>;
  if (kind === "voice") return <div className={b.call} aria-hidden="true">
    <p className={b.callHead}><span className={b.callDot} />Incoming call, 9:04 p.m.</p>
    <div className={b.wave}>{Array.from({ length: 28 }, (_, n) => <i key={n} style={{ "--i": n } as CSSProperties} />)}</div>
    {["Answered by the AI voice agent", "Question answered", "Appointment booked", "Confirmation sent by text", "Summary saved to the CRM"].map((t) => <p key={t} className={b.callStep}>{t}</p>)}
  </div>;
  return <div className={b.agent}>{[["Messenger", agentAsks[0]], ["Instagram", agentAsks[1]], ["Website", agentAsks[2]]].map(([ch, q], n) => <p key={q}><small>{ch}</small><span>{fill(q, audience)}</span><b>{n === 2 ? "Booked" : "Answered"}</b></p>)}</div>;
}

export function BazaarWalk({ bazaar, chibi, audience, brand }: { bazaar: Bazaar; chibi: ChibiCostume; audience: Audience; brand: string }) {
  const root = useRef<HTMLElement>(null);
  const [at, setAt] = useState(0);
  useEffect(() => {
    const el = root.current; if (!el) return;
    const stops = [...el.querySelectorAll<HTMLElement>("[data-stop]")];
    const seen = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setAt(Number((e.target as HTMLElement).dataset.stop));
    }, { rootMargin: "-45% 0px -45% 0px" });
    stops.forEach((s) => seen.observe(s));
    return () => seen.disconnect();
  }, []);
  const t = (text: string) => fill(text, audience);
  const metres = Math.max(0, Math.round((1000 - (at * 1000) / (stallKinds.length + 1)) / 10) * 10);

  return <section ref={root} className={b.walk} data-bazaar-walk="" aria-labelledby="bazaar-title" data-at={at} style={{ "--at": at } as CSSProperties}>
    <div className={b.view} aria-hidden="true"><div className={`${b.painting} ${sh.shaped}`} style={shapedScene(bazaarScene(bazaar.name))} /><div className={b.road} /><div className={b.lanterns} /></div>
    <div className={b.hud}>
      <p className={b.distance}><b>{metres.toLocaleString("en-PH")} m</b> to the Build stall</p>
      <ol className={b.track} aria-hidden="true">{[0, ...stallKinds.map((_, n) => n + 1)].map((n) => <li key={n} data-on={n <= at ? "" : undefined} />)}</ol>
      <a className={b.skip} href="#offer-builder">Skip the bazaar <span aria-hidden="true">→</span></a>
    </div>

    <div className={b.stop} data-stop={0}>
      <p className={b.eyebrow}>Part two / {bazaar.label}</p>
      <h2 id="bazaar-title">Walk the bazaar with KRIV.</h2>
      <p className={b.lead}>{bazaar.label}, {bazaar.setting}. Six stalls stand along the road, a few steps apart. About a kilometre ahead is the Build stall, where you pick what you need. Every price is one yearly price.</p>
    </div>

    {stallKinds.map((kind, n) => <article key={kind} className={b.stop} data-stop={n + 1} aria-labelledby={`stall-${kind}`}>
      <div className={b.sign}>
        <p className={b.eyebrow}>Stall {n + 1} of {stallKinds.length} / {bazaar.stalls[kind]}</p>
        <h3 id={`stall-${kind}`}>{service[kind]}</h3>
        <p>{t(pitch[kind])}</p>
        {kind === "voice" ? <p className={b.price}><b>Priced after a short call</b><small>Call volume sets the cost, so the price comes after a short call.</small></p>
          : <p className={b.price}><b>{php(yearlyOf[kind] * crm.baseMonths)}</b> a year <small>Works out to {php(yearlyOf[kind])} a month.</small></p>}
        {kind === "live-seller" ? <p className={b.note}>Try it first: a paid {liveSeller.starterMonths}-month starter is {php(liveSeller.starterPrice)}, then annual. {LIVE_SELLER_COMMISSION_NOTE}</p> : null}
        <details className={b.built}><summary>How it&apos;s built</summary><ul>{built[kind].map((line) => <li key={line}>{t(line)}</li>)}</ul></details>
        <p className={b.actions}><a href="#offer-builder">{kind === "voice" ? "Ask about it" : "Add to my plan"}</a></p>
      </div>
      <div className={b.exhibit}><Stall kind={kind} audience={audience} chibi={chibi} brand={brand} /></div>
    </article>)}

    <div className={b.stop} data-stop={stallKinds.length + 1}>
      <p className={b.eyebrow}>The Build stall</p>
      <h2>Pick what you need.</h2>
      <p className={b.lead}>Every stall you passed is on the builder below. Choose one or stack a few, and see the yearly total, the free months and the bundle discount.</p>
      <p className={b.actions}><a className={b.go} href="#offer-builder">Build my plan <span aria-hidden="true">↓</span></a></p>
    </div>
  </section>;
}
