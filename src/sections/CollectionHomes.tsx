import { Actions, CollectionGallery, Contact, Eyebrow, Headline, Introduction, Location, Notes, OfferingIndex, Offerings, Questions, Scene, Story, type ContentProps } from "./CollectionParts";
import c from "./collection.module.css";
import type { TemplateDef } from "@/lib/templates";
import type { ComponentType } from "react";

// Each composition owns its actual arrangement. These are not colour variants
// of a common hero or a reordered legacy section list. Shared parts only handle
// content, accessible disclosures, safe internal links and missing information.

function Atrium({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.atriumHero}`}><div className={c.atriumHeading}><Eyebrow site={site} /><Headline site={site} /></div>
      <div className={c.atriumThreshold}><Location site={site} /><Scene site={site} caption /><Introduction site={site} /></div>
    </section>
    <Offerings site={site} treatment="panels" /><Story site={site} treatment="spread" /><Notes site={site} /><CollectionGallery site={site} /><Questions site={site} /><Contact site={site} treatment="folio" />
  </>;
}
function Signal({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.signalHero}`}><div className={c.signalMessage}><Eyebrow site={site} /><Headline site={site} /><Introduction site={site} /></div>
      <div className={c.signalVisual}><Scene site={site} /><div className={c.signalLabel}><span aria-hidden="true">↙</span><Location site={site} /></div></div>
    </section>
    <Notes site={site} /><Offerings site={site} treatment="matrix" /><CollectionGallery site={site} /><Story site={site} treatment="manifesto" /><Questions site={site} /><Contact site={site} treatment="billboard" />
  </>;
}
function Nocturne({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.nocturneHero}`}><div className={c.nocturneSpine}><Eyebrow site={site} /><Location site={site} /></div>
      <div className={c.nocturneTitle}><Headline site={site} /></div><Scene site={site} caption /><Introduction site={site} />
    </section>
    <Story site={site} treatment="letter" /><Offerings site={site} treatment="curtains" /><CollectionGallery site={site} /><Notes site={site} /><Questions site={site} /><Contact site={site} treatment="letterClose" />
  </>;
}
function Press({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.pressHero}`}><div className={c.pressDateline}><Eyebrow site={site} /><Location site={site} /></div><Headline site={site} />
      <div className={c.pressColumns}><Introduction site={site} /><Scene site={site} caption /><OfferingIndex site={site} limit={3} /></div>
    </section>
    <Offerings site={site} treatment="classifieds" /><Notes site={site} /><Story site={site} treatment="spread" /><Questions site={site} /><CollectionGallery site={site} /><Contact site={site} treatment="stamp" />
  </>;
}
function Roastery({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.roasteryHero}`}><div className={c.roasteryPortrait}><Scene site={site} /><Location site={site} /></div>
      <div className={c.roasteryLetter}><Eyebrow site={site} /><Headline site={site} /><Introduction site={site} /><span className={c.roasteryMark} aria-hidden="true">✳</span></div>
    </section>
    <Story site={site} treatment="essay" /><Offerings site={site} treatment="folds" /><Notes site={site} /><CollectionGallery site={site} /><Questions site={site} /><Contact site={site} treatment="stamp" />
  </>;
}
function Tablecloth({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.tableclothHero}`}><div className={c.tableclothCover}><Eyebrow site={site} /><Headline site={site} /><Location site={site} /><Actions site={site} /></div>
      <div className={c.tableclothLeaf}><Scene site={site} caption /><p>{site.hero.sub}</p></div>
    </section>
    <Offerings site={site} treatment="menuCards" /><Story site={site} treatment="letter" /><CollectionGallery site={site} /><Notes site={site} /><Questions site={site} /><Contact site={site} treatment="letterClose" />
  </>;
}
function Furnace({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.furnaceHero}`}><div className={c.furnaceView}><Scene site={site} /><div className={c.furnaceTag}><Eyebrow site={site} /><Location site={site} /></div></div>
      <div className={c.furnaceHeadline}><Headline site={site} /><Introduction site={site} /></div>
    </section>
    <Notes site={site} /><Offerings site={site} treatment="bands" /><Story site={site} treatment="aside" /><Questions site={site} /><CollectionGallery site={site} /><Contact site={site} treatment="ribbonClose" />
  </>;
}
function Botanical({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.botanicalHero}`}><div className={c.botanicalPortrait}><Scene site={site} caption /></div><div className={c.botanicalWords}><Eyebrow site={site} /><Headline site={site} /><Introduction site={site} /></div><Location site={site} /></section>
    <Offerings site={site} treatment="specimens" /><Notes site={site} /><Story site={site} treatment="essay" /><CollectionGallery site={site} /><Questions site={site} /><Contact site={site} treatment="folio" />
  </>;
}
function Runway({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.runwayHero}`}><div className={c.runwayMasthead}><Eyebrow site={site} /><Location site={site} /></div><Headline site={site} />
      <div className={c.runwayStrip}><div className={c.runwaySide}><span aria-hidden="true">↘</span><Actions site={site} /></div><Scene site={site} /><p className={c.runwayCaption}>{site.hero.sub}</p></div>
    </section>
    <CollectionGallery site={site} /><Offerings site={site} treatment="lookbook" /><Story site={site} treatment="manifesto" /><Notes site={site} /><Questions site={site} /><Contact site={site} treatment="billboard" />
  </>;
}
function Tide({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.tideHero}`}><div className={c.tideOpening}><Eyebrow site={site} /><Location site={site} /></div><div className={c.tidePool}><Scene site={site} /></div>
      <div className={c.tideTitle}><Headline site={site} /></div><Introduction site={site} />
    </section>
    <Story site={site} treatment="essay" /><Notes site={site} /><Offerings site={site} treatment="pools" /><Questions site={site} /><CollectionGallery site={site} /><Contact site={site} treatment="folio" />
  </>;
}
function Vault({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.vaultHero}`}><Eyebrow site={site} /><div className={c.vaultPortal}><span aria-hidden="true">Ⅰ</span><Scene site={site} /><Location site={site} /></div>
      <Headline site={site} /><Introduction site={site} />
    </section>
    <Offerings site={site} treatment="vaults" /><Story site={site} treatment="letter" /><Notes site={site} /><CollectionGallery site={site} /><Questions site={site} /><Contact site={site} treatment="stamp" />
  </>;
}
function Blueprint({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.blueprintHero}`}><div className={c.blueprintTitle}><Eyebrow site={site} /><Headline site={site} /><Introduction site={site} /></div>
      <div className={c.blueprintDrawing}><div className={c.blueprintRuler} aria-hidden="true" /><Scene site={site} caption /><div className={c.blueprintKey}><span>01 / Overview</span><Location site={site} /></div></div>
    </section>
    <Offerings site={site} treatment="schematic" /><Notes site={site} /><Story site={site} treatment="spread" /><Questions site={site} /><CollectionGallery site={site} /><Contact site={site} treatment="ribbonClose" />
  </>;
}
function Orbit({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.orbitHero}`}><div className={c.orbitWords}><Eyebrow site={site} /><Headline site={site} /></div>
      <div className={c.orbitDisc}><Scene site={site} /><span aria-hidden="true">＋</span></div><Introduction site={site} /><Location site={site} />
    </section>
    <Notes site={site} /><Story site={site} treatment="aside" /><Offerings site={site} treatment="orbits" /><CollectionGallery site={site} /><Questions site={site} /><Contact site={site} treatment="stamp" />
  </>;
}
function Velocity({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.velocityHero}`}><div className={c.velocityWords}><Eyebrow site={site} /><Headline site={site} /><Introduction site={site} /></div><div className={c.velocityCut}><Scene site={site} /></div>
      <div className={c.velocityTrack}><Location site={site} /><OfferingIndex site={site} limit={3} /></div>
    </section>
    <Offerings site={site} treatment="rungs" /><Story site={site} treatment="manifesto" /><Notes site={site} /><Questions site={site} /><CollectionGallery site={site} /><Contact site={site} treatment="billboard" />
  </>;
}
function Chambers({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.chambersHero}`}><div className={c.chambersHeading}><Eyebrow site={site} /><Headline site={site} /></div>
      <div className={c.chambersPlate}><Scene site={site} caption /><Location site={site} /></div><Introduction site={site} />
    </section>
    <Story site={site} treatment="letter" /><Offerings site={site} treatment="casefiles" /><Notes site={site} /><Questions site={site} /><CollectionGallery site={site} /><Contact site={site} treatment="letterClose" />
  </>;
}
function Horizon({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.horizonHero}`}><div className={c.horizonView}><Scene site={site} /></div><div className={c.horizonCard}><Eyebrow site={site} /><Headline site={site} /><Introduction site={site} /></div><Location site={site} /></section>
    <CollectionGallery site={site} /><Story site={site} treatment="spread" /><Offerings site={site} treatment="horizons" /><Notes site={site} /><Questions site={site} /><Contact site={site} treatment="folio" />
  </>;
}
function Archipelago({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.archipelagoHero}`}><div className={c.archipelagoTitle}><Eyebrow site={site} /><Headline site={site} /></div>
      <div className={c.archipelagoIsland}><Location site={site} /><span aria-hidden="true">✳</span></div><Scene site={site} /><Introduction site={site} />
    </section>
    <Offerings site={site} treatment="islands" /><CollectionGallery site={site} /><Notes site={site} /><Story site={site} treatment="aside" /><Questions site={site} /><Contact site={site} treatment="stamp" />
  </>;
}
function Air({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.airHero}`}><div className={c.airWords}><Eyebrow site={site} /><Headline site={site} /><Introduction site={site} /></div>
      <div className={c.airWindow}><Scene site={site} /><Location site={site} /></div><OfferingIndex site={site} limit={3} />
    </section>
    <Notes site={site} /><Offerings site={site} treatment="paths" /><Questions site={site} /><Story site={site} treatment="spread" /><CollectionGallery site={site} /><Contact site={site} treatment="folio" />
  </>;
}
function Terminal({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.terminalHero}`}><div className={c.terminalHeading}><Eyebrow site={site} /><Headline site={site} /><Location site={site} /></div>
      <div className={c.terminalScreen}><Scene site={site} caption /><div className={c.terminalDirectory}><Introduction site={site} /><OfferingIndex site={site} /></div></div>
    </section>
    <Offerings site={site} treatment="console" /><Notes site={site} /><Questions site={site} /><Story site={site} treatment="aside" /><CollectionGallery site={site} /><Contact site={site} treatment="ribbonClose" />
  </>;
}
function Journal({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.journalHero}`}><div className={c.journalMargin}><Eyebrow site={site} /><Location site={site} /></div><div className={c.journalPage}><Scene site={site} /><Headline site={site} /><Introduction site={site} /></div></section>
    <Notes site={site} /><Offerings site={site} treatment="chapters" /><Story site={site} treatment="essay" /><Questions site={site} /><CollectionGallery site={site} /><Contact site={site} treatment="letterClose" />
  </>;
}
function Axis({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.axisHero}`}><div className={c.axisImage}><Scene site={site} /><Location site={site} /></div><div className={c.axisWords}><Eyebrow site={site} /><Headline site={site} /><Introduction site={site} /></div><span className={c.axisMark} aria-hidden="true">↘</span></section>
    <Story site={site} treatment="manifesto" /><Offerings site={site} treatment="axisRows" /><CollectionGallery site={site} /><Notes site={site} /><Questions site={site} /><Contact site={site} treatment="ribbonClose" />
  </>;
}
function Ripple({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.rippleHero}`}><div className={c.rippleSurface}><Eyebrow site={site} /><Scene site={site} /><Location site={site} /></div>
      <div className={c.rippleWords}><Headline site={site} /><Introduction site={site} /></div>
    </section>
    <Offerings site={site} treatment="ripples" /><Questions site={site} /><Notes site={site} /><Story site={site} treatment="essay" /><CollectionGallery site={site} /><Contact site={site} treatment="folio" />
  </>;
}
function Dispatch({ site }: ContentProps) {
  return <>
    <section className={`${c.hero} ${c.dispatchHero}`}><div className={c.dispatchTicket}><Eyebrow site={site} /><Headline site={site} /><Actions site={site} /><Location site={site} /></div>
      <div className={c.dispatchEvidence}><Scene site={site} caption /><p>{site.hero.sub}</p><OfferingIndex site={site} limit={2} /></div>
    </section>
    <Notes site={site} /><Offerings site={site} treatment="tickets" /><Story site={site} treatment="spread" /><CollectionGallery site={site} /><Questions site={site} /><Contact site={site} treatment="billboard" />
  </>;
}

export const collectionHomes = { atrium: Atrium, signal: Signal, nocturne: Nocturne, press: Press, roastery: Roastery, tablecloth: Tablecloth, furnace: Furnace, botanical: Botanical, runway: Runway, tide: Tide, vault: Vault, blueprint: Blueprint, orbit: Orbit, velocity: Velocity, chambers: Chambers, horizon: Horizon, archipelago: Archipelago, air: Air, terminal: Terminal, journal: Journal, axis: Axis, ripple: Ripple, dispatch: Dispatch } satisfies Record<Exclude<NonNullable<TemplateDef["composition"]>, "canvas" | "index" | "stage">, ComponentType<ContentProps>>;
export type CollectionComposition = keyof typeof collectionHomes;
