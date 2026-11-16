import type { CSSProperties } from "react";
import type { SiteData } from "@/lib/site-schema";
import { dentalJourney } from "@/stories/dental-journey";
import { buildCast } from "@/stories/casts";
import { dentalCast } from "@/stories/casts/dental";
import { BookButton, JourneyFrame } from "./JourneyBlocks";
import { ClinicJourney } from "./ClinicJourney";
import Link from "next/link";
import { pageHref } from "@/lib/site-pages";
import { JourneyLogo, logoWords } from "./JourneyLogo";
import { JourneyScroller } from "./JourneyScroller";
import { journeyLores, journeyStyle } from "@/stories/journey-style";
import o from "./offer.module.css";
import j from "./journey.module.css";

// A lead's home page told as a scroll journey (preview-only; set with
// `story` in the lead record). One drawing of a tooth stays in view and changes
// with each chapter while the narration scrolls past; the clinic's own details
// follow. It keeps every guardrail: the concept banner, inert actions, no form,
// and placeholders wherever the clinic has not confirmed a fact.

const i = (n: number) => ({ "--i": n }) as CSSProperties;
const TOOTH = "M200 96 C176 78 122 84 120 148 C119 196 138 214 144 262 C148 296 152 334 168 334 C184 334 182 286 200 286 C218 286 216 334 232 334 C248 334 252 296 256 262 C262 214 281 196 280 148 C278 84 224 78 200 96 Z";
const plaque = [[138, 118, 9], [160, 100, 7], [186, 104, 8], [214, 104, 8], [240, 100, 7], [262, 118, 9], [130, 150, 8], [270, 150, 8], [150, 132, 6], [250, 132, 6], [200, 116, 7], [174, 124, 5], [226, 124, 5]];
const crumbs = [[150, 30, 5], [188, 10, 4], [222, 24, 6], [256, 6, 4], [172, 44, 3], [238, 48, 3]];
const smile = [-3, -2, -1, 0, 1, 2, 3];

function Stage() {
  return <div className={j.stage} aria-hidden="true">
    <svg viewBox="0 0 400 400" className={j.art}>
      <circle className={j.orbit} cx="200" cy="205" r="176" />
      <circle className={j.orbit2} cx="200" cy="205" r="150" />
      <g className={j.smile}>
        {smile.map((n) => <rect key={n} x={200 + n * 44 - 18} y={170 + Math.abs(n) * Math.abs(n) * -7} width="36" height="52" rx="12" style={i(n + 3)} />)}
        <path d="M62 196 Q200 336 338 196" />
      </g>
      <g className={j.tooth}>
        <path className={j.body} d={TOOTH} />
        <path className={j.enamel} d={TOOTH} pathLength={100} />
        <path className={j.shine} d="M146 140 C146 116 160 106 176 104" />
        <g className={j.crumbs}>{crumbs.map(([x, y, r], n) => <circle key={n} cx={x} cy={y} r={r} style={i(n)} />)}</g>
        <g className={j.plaque}>{plaque.map(([x, y, r], n) => <circle key={n} cx={x} cy={y} r={r} style={i(n)} />)}</g>
        <g className={j.spot}><circle cx="232" cy="158" r="7" /><circle className={j.ring} cx="232" cy="158" r="20" /></g>
        <g className={j.mirror}><line x1="300" y1="300" x2="352" y2="360" /><circle cx="286" cy="284" r="24" /></g>
        <g className={j.brush}><rect x="96" y="40" width="120" height="16" rx="8" /><g>{[0, 1, 2, 3, 4, 5].map((n) => <rect key={n} x={104 + n * 12} y="56" width="7" height="20" rx="3" />)}</g></g>
        <path className={j.floss} d="M96 250 C150 210 250 300 304 236" pathLength={100} />
        <g className={j.sparks}>{[[110, 96], [296, 110], [316, 226], [88, 236]].map(([x, y], n) => <path key={n} d={`M${x} ${y - 10} L${x + 3} ${y - 3} L${x + 10} ${y} L${x + 3} ${y + 3} L${x} ${y + 10} L${x - 3} ${y + 3} L${x - 10} ${y} L${x - 3} ${y - 3} Z`} style={i(n)} />)}</g>
      </g>
    </svg>
  </div>;
}

export function JourneySite({ site }: { site: SiteData }) {
  const { business } = site;
  const { letters, ring } = logoWords(site);
  const look = journeyStyle(site);
  const label = journeyLores[look.lore];
  const cast = buildCast(dentalCast, dentalJourney.map((step) => step.id), site.storyCast ?? "serious", look.seed, look);
  const book = <BookButton site={site} />;
  const nav = <>
    <a href="#journey-smile">The story</a>
    {site.services ? <a href="#services">Services</a> : null}
    {site.about ? <a href="#about">About</a> : null}
    <a href="#visit">Visit</a>
    <Link href={pageHref(site, "brand-kit")} prefetch={false}>Brand kit</Link>
  </>;
  return <JourneyFrame site={site} nav={nav}>
      <JourneyScroller id={site.slug} className={j.journey} voiceClassName={j.voice} cueClassName={j.cue} cast={cast}>
        <p className={j.crest}><span><JourneyLogo letters={letters} compact /><b>{ring}</b></span></p>
        <ol className={j.dots} aria-label="Chapters of the story">
          {dentalJourney.map((step, n) => <li key={step.id}><a href={`#journey-${step.id}`} aria-label={`Chapter ${n + 1}: ${step.chapter}`} /></li>)}
        </ol>
        <Stage />
        <div className={j.steps}>
          {dentalJourney.map((step, n) => <section key={step.id} id={`journey-${step.id}`} className={j.step} data-journey-step="" data-audio={step.audio} aria-labelledby={`journey-${step.id}-title`}>
            <div className={j.words}>
              <p className={o.eyebrow}><b>{label(n + 1, dentalJourney.length, step.chapter).lead}</b> / {step.chapter}</p>
              {n === 0 ? <>
                <p className={j.clinic}>{site.hero.eyebrow ?? business.category}</p>
                <h1 id={`journey-${step.id}-title`}>{step.title}</h1>
              </> : <h2 id={`journey-${step.id}-title`}>{step.title}</h2>}
              <p className={j.narration} data-narration="">{step.narration}</p>
              {step.note ? <p className={j.note}>{step.note}</p> : null}
              {n === 0 ? <p className={j.hint}>Scroll to begin <span aria-hidden="true">↓</span> Each chapter is read aloud. Tap anywhere to start the sound.</p> : null}
              {n === dentalJourney.length - 1 ? <p className={o.actions}>{book}<a href="#inside">Step inside the clinic</a></p> : null}
            </div>
          </section>)}
        </div>
      </JourneyScroller>

      <ClinicJourney site={site} />
  </JourneyFrame>;
}
