import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { addOns, annualPlans, bundleQuote, contentTiers, crm, decisionWindows, monthlyServices, percent, TRIAL_DAYS } from "@/offers/ph-local";
import { pageHref } from "@/lib/site-pages";
import type { SiteData } from "@/lib/site-schema";
import { conceptNotice } from "@/sections/Chrome";
import { inert } from "@/sections/inert";
import { PhEffects } from "@/sections/PhEffects";
import { PhLogoPlay } from "@/sections/PhLogoPlay";
import { PhMarquee } from "@/sections/PhMarquee";
import { AssistantPreview } from "./AssistantPreview";
import { PcoFxLayer } from "./PcoFxLayer";
import type { PcoFx, PcoSection } from "./pco-fx";
import campaign from "./campaign.json";
import s from "./pco.module.css";

const media = "/for/pco-client";
const peso = (value: number) => "₱" + value.toLocaleString("en-PH");
const website = monthlyServices[0];
const content = monthlyServices[1];
const assistant = addOns[1];
const pilotPlans = annualPlans.filter(({ name }) => [website.name, content.name, assistant.name].some((service) => service === name));
const pilotQuotes = decisionWindows.map((window) => ({ ...window, ...bundleQuote(pilotPlans, window) }));
const featured = [3, 5, 8];
const path = (day: number) => `${media}/posts/pco-${String(day).padStart(2, "0")}-thumb.webp`;

const trialSteps = [
  ["Set up", "Confirm clinic information and the first inquiry channel. Choose the campaign pieces to review and agree on which questions the assistant can answer."],
  ["Try it", "Review the website on a phone, approve a first batch of social drafts, and work through sample inquiries with someone from the clinic."],
  ["Review together", "Check where the experience still needs work. If a channel goes live with your approval, review inquiry counts and response times with the clinic before deciding."],
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function Mark() {
  return <Image className={s.mark} src={`${media}/mark-light.webp`} width={44} height={44} alt="" unoptimized />;
}

// PCO's colours as the effects arsenal's tokens (PhLayers, PhBackdrop, PhMarquee and PhLogoPlay read these).
const FX_TOKENS = { "--care": "#087759", "--sand": "#9fd3c9", "--spark": "#cfeadf", "--line": "#dce4df", "--subtle": "#43594f", "--display": "'Pco Serif', Georgia, serif", "--body": "'Pco Sans', Arial, sans-serif", "--gutter": "0px" } as CSSProperties;
const HINTS = { wave: "Make waves · click to splash", repel: "Push the mark around", drag: "Pick up a letter and throw it" } as const;

export function PcoClientSite({ site, fx }: { site: SiteData; fx?: PcoFx | null }) {
  const { business } = site;
  const address = business.address;
  const spotlight = featured.map((day) => campaign.find((post) => post.day === day)!);
  // With an effects seed, each section gets its moving layer; without one the page renders exactly as published.
  const bg = (section: PcoSection) => fx ? { "data-bg": "", "data-fx": fx.layers[section] } : {};
  const layer = (section: PcoSection) => fx && <PcoFxLayer kind={fx.layers[section]} />;
  const reveal = fx ? { "data-reveal": "" } : {};
  const magnet = fx ? { "data-magnet": "" } : {};
  const count = (text: string) => fx ? <span data-count={text}>{text}</span> : text;
  const facts = [`${TRIAL_DAYS}-day free trial`, "No setup fee", "Your team reviews the dental wording", "Your clinic owns its domain, accounts, content and data", "Billed annually if you continue"];
  return (
    <div className={s.page} style={fx ? FX_TOKENS : undefined} data-fx={fx ? "" : undefined} data-seed={fx?.seed} data-motion={fx ? "reveal" : undefined} data-touch={fx?.touch} data-molar={fx?.molar}>
      {fx && <PhEffects />}
      <a className={s.skip} href="#clinic">Skip to the clinic website</a>
      <div role="note" className={s.concept}>{conceptNotice(business.name)}</div>
      <header className={s.header}>
        <div className={s.bar}>
          <a href="#clinic" className={s.identity}><Mark /><span>PCO Dental<span className={s.wordmarkCity}>Mandaue</span></span></a>
          <nav className={s.clinicNav} aria-label="Clinic website">
            <a href="#clinic">Home</a><a href="#first-visit">First visit</a><a href="#visit">Location</a>
          </nav>
          <a className={s.headerOffer} href="#proposal">KRIV offer <Arrow /></a>
        </div>
      </header>
      <main id="clinic">
        <section className={s.hero} aria-labelledby="hero-heading">
          <div className={s.heroGrid} {...bg("hero")}>
            {layer("hero")}
            <div className={s.heroCopy}>
              <p className={s.kicker}>PCO Dental Clinic · Mandaue City</p>
              <h1 id="hero-heading">We create<br /><em>smiles.</em></h1>
              <p>Dental care in Mandaue. Get to know the clinic, prepare for your first visit, and find out how to reach the team.</p>
              <div className={s.heroActions}>
                <a className={s.buttonInk} href="#visit" {...magnet}>Plan your visit <Arrow /></a>
                <a className={s.buttonQuiet} href="#first-visit" {...magnet}>What to expect</a>
              </div>
            </div>
            <figure className={s.heroPhoto}>
              <Image src={`${media}/dental-sculpture.webp`} width={1080} height={1080} alt="Illustration of a translucent ceramic molar sculpture" preload unoptimized />
              <figcaption>Dental model illustration</figcaption>
            </figure>
          </div>
        </section>
        {fx && <PhMarquee items={campaign.map((post) => post.title)} label="Topics in the 30-day campaign" seconds={120} />}

        <section className={s.clinicBody} aria-labelledby="first-visit" {...bg("clinic")}>
          {layer("clinic")}
          <div className={s.wrap}>
            <div className={s.clinicMosaic}>
              <div className={s.clinicIntro}>
                <p className={s.kicker}>Your first visit</p><h2 id="first-visit" {...reveal}>Know what <em>to ask.</em></h2>
                <p>Whether you’re planning a checkup or have a question about your teeth, you can start by telling the team what brings you in.</p>
                <div className={s.visitGuide}>
                  <details><summary>What should I bring?</summary><p>If you have recent dental records or a list of medicines, ask the clinic whether you should bring them. Write down any questions you want to cover.</p></details>
                  <details><summary>What if I’m nervous about a visit?</summary><p>Tell the team ahead of time or when you arrive. You can ask the dentist to explain the next step and agree on a signal if you need a pause.</p></details>
                  <details><summary>How can I confirm a schedule or ask about fees?</summary><p>Contact the clinic directly. The team can confirm the schedule and explain which information it needs to answer a question about fees.</p></details>
                </div>
              </div>
              <figure className={s.visitPhoto}>
                <Image src={`${media}/smile-editorial.webp`} width={1360} height={907} alt="Illustrative portrait of a smiling woman in soft sunlight" unoptimized />
                <figcaption>Illustrative portrait</figcaption>
              </figure>
            </div>
            <div className={s.visit} id="visit">
              <div><p className={s.kicker}>Find the clinic</p><h2 {...reveal}>Mandaue City, Cebu.</h2></div>
              <div className={s.visitDetails}>
                <address>{address.line1}<br />{address.city}, {address.region} {address.postalCode}</address>
                <p><a {...inert}>{business.phoneDisplay}</a><span aria-hidden="true"> · </span><a {...inert}>Facebook</a></p>
                <small>Phone and messaging are inactive in this concept.</small>
              </div>
            </div>
          </div>
        </section>

        <section id="proposal" className={s.proposal} aria-labelledby="proposal-heading" {...bg("proposal")}>
          {layer("proposal")}
          <div className={s.wrap}>
            <div className={s.proposalTop}>
              <span className={s.kriv}>KRIV <small>AGENCY</small></span>
              <nav aria-label="Proposal"><a href="#campaign">Campaign</a><a href="#pilot">Trial</a><a href="#investment">Pricing</a></nav>
            </div>
            <div className={s.proposalGrid}>
              <div>
                <p className={s.kickerDark}>Prepared for Dr. Peter</p>
                <h2 id="proposal-heading" {...reveal}>Make it easier to <em>choose PCO.</em></h2>
                <p>Someone in Mandaue sees a useful dental post, finds a website that answers their first questions, and knows how to reach your team. KRIV builds and manages those three steps with you.</p>
                <a className={s.buttonLight} href="#pilot" {...magnet}>See the 14-day trial <Arrow /></a>
              </div>
              <div className={s.film}>
                <video controls playsInline preload="none" poster={`${media}/pitch-poster.webp`} aria-label="The next chapter of PCO Dental Clinic’s digital presence">
                  <source src={`${media}/pco-presentation.mp4`} type="video/mp4" />
                  <track kind="captions" src={`${media}/pco-presentation.vtt`} srcLang="en" label="English" />
                </video>
                <div><strong>The next chapter of your digital presence</strong><span>1:58 · Narrated proposal</span></div>
              </div>
            </div>
          </div>
        </section>

        <section id="campaign" className={s.campaign} aria-labelledby="campaign-heading" {...bg("campaign")}>
          {layer("campaign")}
          <div className={s.wrap}>
            <div className={s.sectionHead}>
              <div><p className={s.kicker}>The 30-day campaign</p><h2 id="campaign-heading" {...reveal}>A month of questions<br />worth answering.</h2></div>
              <p>Start with the pieces that are most useful to your patients. KRIV prepares the graphics and copy. Your team reviews the dental wording before anything goes out.</p>
            </div>
            <div className={s.cards}>
              {spotlight.map((post, index) => (
                <article key={post.day} className={s.card} {...reveal} style={{ "--d": index } as CSSProperties}>
                  {index === 0 ? (
                    <div className={s.sampleFrame}>
                      <Image src={path(post.day)} alt={post.title + " campaign artwork"} width={360} height={450} unoptimized />
                    </div>
                  ) : (
                    <video className={s.sampleFrame} controls playsInline preload="none" poster={path(post.day)} aria-label={post.title}>
                      <source src={`${media}/pco-reel-${post.day}.mp4`} type="video/mp4" />
                      <track kind="captions" src={`${media}/pco-reel-${post.day}.vtt`} srcLang="en" label="English" />
                    </video>
                  )}
                  <div className={s.cardCopy}><p className={s.kicker}>{index === 0 ? "Carousel" : index === 1 ? "15-second Reel" : "30-second Reel"}</p><h3>{post.title}</h3></div>
                  {index === 0 && <details className={s.cardCarousel}>
                    <summary>View all five slides</summary>
                    <ol>{["What can happen at a dental checkup?", "Talk about what brings you in", "The dentist may take a closer look", "Ask what the dentist recommends and why", "Ask the clinic what to expect"].map((title, i) =>
                      <li key={title}><Image src={`${media}/checkup-${i + 1}.webp`} width={600} height={750} alt={title} unoptimized loading="lazy" /></li>
                    )}</ol>
                  </details>}
                </article>
              ))}
            </div>
            <div className={s.library} id="campaign-library">
              <details>
                <summary>See all 30 campaign drafts</summary>
                <ol>{campaign.map((post) => <li key={post.day}>
                  <Image src={path(post.day)} alt="" width={360} height={450} loading="lazy" unoptimized />
                  <p><span>Day {post.day}</span>{post.title}</p>
                </li>)}</ol>
              </details>
            </div>
          </div>
        </section>

        <section className={s.assistant} aria-labelledby="assistant-heading" {...bg("assistant")}>
          {layer("assistant")}
          <div className={`${s.wrap} ${s.twoColumns}`}>
            <div><p className={s.kicker}>Try the assistant</p><h2 id="assistant-heading" {...reveal}>Routine questions.<br />A clear handoff.</h2>
              <p>Patients can get clinic-approved information about where to go or how to ask about an appointment. Your team confirms bookings and handles clinical questions.</p>
            </div>
            <AssistantPreview />
          </div>
        </section>

        <section id="pilot" className={s.pilot} aria-labelledby="pilot-heading" {...bg("pilot")}>
          {layer("pilot")}
          <div className={s.wrap}>
            <div className={s.sectionHead}>
              <div><p className={s.kicker}>{TRIAL_DAYS}-day free trial</p><h2 id="pilot-heading" {...reveal}>Try it with<br />your team.</h2></div>
              <p>Start with the website, a first batch of campaign drafts and a supervised inquiry assistant. There’s no setup fee. If you continue, the paid plan is billed annually.</p>
            </div>
            <ol className={s.timeline} data-progress={fx ? "rail" : undefined}>{trialSteps.map(([title, body], index) => <li key={title} data-i={fx ? index : undefined}>
              <span>0{index + 1}</span><h3>{title}</h3><p>{body}</p>
            </li>)}</ol>
          </div>
        </section>

        <section id="investment" className={s.pricing} aria-labelledby="pricing-heading" {...bg("pricing")}>
          {layer("pricing")}
          <div className={s.wrap}>
            <div className={s.sectionHead}>
              <div><p className={s.kickerDark}>Your options after the trial</p><h2 id="pricing-heading" {...reveal}>What you<br />would pay.</h2></div>
              <p>Choose one service or keep all three. The rates below show the monthly equivalent before annual bundle discounts. Your clinic owns its domain, accounts, content and data.</p>
            </div>
            <div className={s.priceCards}>
              <article><h3>Website</h3><p className={s.rate}>{count(peso(website.monthly))}<small> / month</small></p><p>Mobile-first site, clinic information, inquiry setup, search setup and ongoing updates.</p></article>
              <article><h3>Content creation</h3><p className={s.rate}>{count(peso(content.monthly))}<small> / month</small></p><p>12 branded image posts a month, with captions, planning and scheduling after your approval.</p></article>
              <article><h3>AI inquiry assistant</h3><p className={s.rate}>{count(peso(assistant.price))}<small> / month</small></p><p>Clinic-approved answers, staff handoff and KRIV supervision.</p></article>
            </div>
            <div className={s.bundle}>
              <div><p className={s.kicker}>All three services</p><h3>{count(peso(pilotQuotes[0].pay))}<small> annual payment</small></h3>
                <p>Website, content, and AI assistant with the {percent(pilotQuotes[0].rate)} annual bundle discount. Get extra months of service when you decide during the trial.</p></div>
              <dl>{pilotQuotes.map((quote) => <div key={quote.fromDay}>
                <dt>{quote.toDay ? `Trial days ${quote.fromDay}–${quote.toDay}` : "Day 15 onward"}</dt>
                <dd>{quote.months} months covered</dd>
              </div>)}</dl>
            </div>
            <details className={s.addons}>
              <summary>Optional services and scope</summary>
              <p><strong>Brand kit</strong> {peso(addOns[0].price)} one time. The concept above uses the A5 identity you’ve already seen.</p>
              <p><strong>CRM and automations</strong> {peso(crm.promoMonthly)} promotional monthly equivalent, billed annually. Add inquiry tracking, appointment reminders and reporting after the workflow is agreed.</p>
              <p><strong>Additional content</strong> {contentTiers[1].name} posts, Reels, Stories and full social management are quoted to scope. The 30-day campaign and Reels above illustrate the creative direction.</p>
              <p>Advertising spend, third-party fees, shoots and work beyond the agreed scope are separate. Revision rounds and any additional work are agreed in writing.</p>
              <Link href={pageHref(site, "offer")} prefetch={false}>Open the complete Philippine rate sheet <Arrow /></Link>
            </details>
          </div>
        </section>

        <section className={s.next} aria-labelledby="next-heading" {...bg("next")}>
          {layer("next")}
          <div className={`${s.wrap} ${s.twoColumns}`}>
            <div><p className={s.kicker}>Next step</p><h2 id="next-heading" {...reveal}>Let’s set up<br />your trial.</h2></div>
            <div>
              <p>In one short kickoff, we’ll settle three things with you.</p>
              <ul><li>Choose the first campaign pieces to review.</li><li>Confirm services, hours and the best inquiry channel.</li><li>Pick who approves content and receives requests.</li></ul>
              <p className={s.nextEmail}>Reply to KRIV to arrange a kickoff · <a {...inert}>hello@kriv.agency</a></p>
              <a href="#clinic" className={s.back}>Back to the website preview ↑</a>
            </div>
          </div>
          {fx?.marquee === "two" && <PhMarquee items={facts} tone="big" reverse seconds={44} />}
        </section>
      </main>
      {fx && <div className={s.fxFooter} data-tone={fx.footerTone}>
        <PhLogoPlay mode={fx.footer} letters={["P", "C", "O", ""]} className={s.pcoPlay} lastClass={s.pcoLine} hint={HINTS[fx.footer]} spin={false} />
      </div>}
      <footer className={s.footer}><div className={s.wrap}><span><Mark /> <strong>PCO Dental Clinic</strong></span><small>Website concept and proposal by KRIV Agency</small></div></footer>
    </div>
  );
}
