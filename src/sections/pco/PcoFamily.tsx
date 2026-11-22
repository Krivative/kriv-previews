import type { CSSProperties, ReactNode } from "react";
import type { SiteData } from "@/lib/site-schema";
import { inert } from "@/sections/inert";
import { PcoArt } from "./PcoArt";
import { PcoFxLayer } from "./PcoFxLayer";
import type { PcoFx } from "./pco-fx";
import s from "./pco.module.css";

// The clinic-website half of a generation 3 PCO seed (whole-site randomizer, 23 Nov 2026), written for adults whose
// children are old enough for braces and who may be weighing bigger treatments themselves. PCO has not confirmed its
// treatments yet: nothing here says the clinic offers a treatment. Parents get questions to ask; treatments are labelled
// as examples to confirm with the clinic. Graphics are drawn in code (PcoArt), no photos of people.

const parentQs = [
  ["When should we ask about straightening?", "Ask at your child’s next checkup. The dentist can tell you what they see now and when to look again."],
  ["What does treatment involve over the months?", "Ask how many visits to expect, how long each stage takes, and what your child needs to do at home."],
  ["How do we plan for the cost?", "Ask the clinic for a written plan with each step and its fee before you decide."],
] as const;
const treatments = [
  { art: "braces", name: "Straightening teeth", ask: "Ask which option suits your child’s age and teeth, and how progress is checked along the way." },
  { art: "implant", name: "Replacing a missing tooth", ask: "Ask what the steps are, how long healing takes, and which alternatives exist." },
  { art: "crown", name: "Restoring a damaged tooth", ask: "Ask whether a crown is needed, how many visits it takes, and how to care for it after." },
] as const;
const steps = [
  ["Consultation", "Talk about what brings you in and what you hope for."],
  ["Written plan", "Ask for the steps, timing and fees in writing."],
  ["Treatment visits", "Keep each appointment and ask what to do at home in between."],
  ["Follow-up", "Come back for checks so the result lasts."],
] as const;

export function PcoFamily({ fx, site }: { fx: PcoFx; site: SiteData }) {
  const { layout, art, order, headline, extra } = fx.site!;
  const { business } = site, address = business.address;
  const [first, ...rest] = headline.split(" ");
  const reveal = { "data-reveal": "" };
  const tilt = fx.style && fx.style.pointer !== "spotlight" ? { "data-tilt": "" } : {};
  const bg = (kind: Parameters<typeof PcoFxLayer>[0]["kind"]) => ({ "data-bg": "", "data-fx": kind });

  const hero = <section className={s.famHero} data-layout={layout} aria-labelledby="hero-heading">
    <div className={s.famHeroInner} {...bg(fx.layers.hero)}>
      <PcoFxLayer kind={fx.layers.hero} />
      <div className={s.famHeroCopy}>
        <p className={s.kicker}>PCO Dental Clinic · Mandaue City</p>
        <h1 id="hero-heading">{first} <em>{rest.join(" ")}</em></h1>
        <p>Thinking about braces for your child, or a bigger treatment for yourself? Start with a consultation, bring your questions, and ask for a clear plan.</p>
        <div className={s.heroActions}>
          <a className={s.buttonInk} href="#visit" data-magnet="">Plan a consultation <span aria-hidden="true">↗</span></a>
          <a className={s.buttonQuiet} href="#for-parents" data-magnet="">Questions parents ask</a>
        </div>
        {layout === "stack" && <nav className={s.famShortcuts} aria-label="On this page"><a href="#for-parents">For parents</a><a href="#treatments">Bigger treatments</a><a href="#plan">The plan</a><a href="#visit">Find the clinic</a></nav>}
      </div>
      <div className={s.famHeroArt}><PcoArt subject="braces" style={art} title="Drawing of a row of teeth with braces" /></div>
    </div>
  </section>;

  const parents = <section id="for-parents" className={s.famParents} aria-labelledby="parents-heading" {...bg(fx.layers.clinic)}>
    <PcoFxLayer kind={fx.layers.clinic} />
    <div className={`${s.wrap} ${s.famTwo}`}>
      <div>
        <p className={s.kicker}>For parents</p>
        <h2 id="parents-heading" {...reveal}>Is it time <em>for braces?</em></h2>
        <p>Children’s teeth change quickly. A checkup is a good moment to ask whether to watch, wait or plan.</p>
        <div className={s.visitGuide}>{parentQs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </div>
      <figure className={s.famArtCard} {...reveal} {...tilt}><PcoArt subject="plan" style={art} title="Drawing of a four-step treatment path" /><figcaption>Illustration</figcaption></figure>
    </div>
  </section>;

  const bigger = <section id="treatments" className={s.famTreat} aria-labelledby="treat-heading" {...bg(extra[0])}>
    <PcoFxLayer kind={extra[0]} />
    <div className={s.wrap}>
      <div className={s.sectionHead}>
        <div><p className={s.kicker}>Bigger treatments</p><h2 id="treat-heading" {...reveal}>Plan the big ones <em>together.</em></h2></div>
        <p>Some treatments take months and a real budget. These are examples to talk through with the clinic; Dr. Peter confirms which treatments PCO offers.</p>
      </div>
      <div className={s.famCards}>{treatments.map((t, i) => <article key={t.name} {...reveal} {...tilt} style={{ "--d": i } as CSSProperties}>
        <PcoArt subject={t.art} style={art} title={`Drawing: ${t.name.toLowerCase()}`} />
        <p className={s.famTag}>Example · to confirm with the clinic</p>
        <h3>{t.name}</h3><p>{t.ask}</p>
      </article>)}</div>
    </div>
  </section>;

  const plan = <section id="plan" className={s.famPlan} aria-labelledby="plan-heading" {...bg(extra[1])}>
    <PcoFxLayer kind={extra[1]} />
    <div className={s.wrap}>
      <p className={s.kicker}>The plan</p>
      <h2 id="plan-heading" {...reveal}>From first visit <em>to follow-up.</em></h2>
      <ol className={s.timeline} data-progress="rail">{steps.map(([title, body], i) => <li key={title} data-i={i}><span>0{i + 1}</span><h3>{title}</h3><p>{body}</p></li>)}</ol>
    </div>
  </section>;

  const visit: ReactNode = <section className={s.famVisitWrap}><div className={s.wrap}>
    <div className={s.visit} id="visit">
      <div><p className={s.kicker}>Find the clinic</p><h2 {...reveal}>Mandaue City, Cebu.</h2></div>
      <div className={s.visitDetails}>
        <address>{address.line1}<br />{address.city}, {address.region} {address.postalCode}</address>
        <p><a {...inert}>{business.phoneDisplay}</a><span aria-hidden="true"> · </span><a {...inert}>Facebook</a></p>
        <small>Phone and messaging are inactive in this concept.</small>
      </div>
    </div>
  </div></section>;

  return <>{hero}{order === "parents-first" ? <>{parents}{bigger}</> : <>{bigger}{parents}</>}{plan}{visit}</>;
}
