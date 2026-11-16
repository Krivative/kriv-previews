import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteData } from "@/lib/site-schema";
import { SiteRenderer } from "@/sections/SiteRenderer";
import { templates } from "@/templates";
import { dentalJourney } from "@/stories/dental-journey";
import { buildCast, castRoles, castVoice, expressions, moves, type CastRole } from "@/stories/casts";
import { dentalCast } from "@/stories/casts/dental";
import { ratesCast } from "@/stories/casts/rates";
import { ratesJourney } from "@/stories/rates-journey";
import { PhRatesPage } from "@/sections/PhRatesPage";
import { MAX_BUNDLE_SAVING, annualPay, annualPlans, annualWorth, decisionWindows, monthlyServices, percent, php } from "@/offers/ph-local";

const pco = JSON.parse(readFileSync(path.join(__dirname, "..", "leads", "pco-dental-clinic.json"), "utf8"));
const ids = dentalJourney.map((step) => step.id);
const render = (input: unknown) => { const site = SiteData.parse(input); return renderToStaticMarkup(<SiteRenderer site={site} template={templates[site.template]} />); };
const speaking: CastRole[] = ["guide", "expert", "heckler"];

describe("the cast: roles and drawings", () => {
  it("has all four roles, each an inline drawing in theme colours with the six faces", () => {
    expect(Object.keys(dentalCast.members).sort()).toEqual([...castRoles].sort());
    for (const role of castRoles) {
      const art = renderToStaticMarkup(<>{dentalCast.members[role].art}</>);
      expect(art).toMatch(/^<svg viewBox="0 0 120 140" role="img" aria-label="[^"]+" data-cast-art=""/);
      for (const face of expressions) expect(art).toContain(`data-face="${face}"`);
      expect(art).toContain("var(--ink)");
      expect(art).not.toMatch(/<image\b|href=|url\(|\.gif|\.png|\.jpg/);
    }
  });
  it("keeps every line a draft until the client approves it", () => {
    expect(dentalCast.draft).toBe(true);
  });
});

describe("the cast: lines", () => {
  it("gives the three speaking roles a short line for every chapter", () => {
    for (const role of speaking) for (const id of ids) {
      const lines = dentalCast.members[role].lines[id];
      expect(lines?.length, `${role}/${id}`).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line.text.length).toBeLessThanOrEqual(64);
        if (line.face) expect(expressions).toContain(line.face);
        if (line.move) expect(moves).toContain(line.move);
      }
    }
  });
  it("keeps the heckler off the visitor and the serious pair off the clinic", () => {
    const of = (role: CastRole) => Object.values(dentalCast.members[role].lines).flat().map((l) => l.text).join(" ");
    expect(`${of("heckler")} ${dentalCast.tease.text}`).not.toMatch(/\byou(r|rs)?\b|teeth are|breath|business/i);
    expect(`${of("guide")} ${of("expert")}`).not.toMatch(/PCO|this clinic|our clinic|guarantee|cure|you should|you must|best|painless|\d+%/i);
    expect(`${of("guide")} ${of("expert")} ${of("heckler")}`).not.toMatch(/wayaway/i);
  });
});

describe("the cast: casting a story", () => {
  it("gives one appearance per chapter, opened and closed by the guide", () => {
    const cast = buildCast(dentalCast, ids, "full", "pco-dental-clinic")!;
    expect(cast.beats.length).toBe(ids.length);
    expect(cast.beats.every(Boolean)).toBe(true);
    expect(cast.beats[0]?.role).toBe("guide");
    expect(cast.beats[ids.length - 1]?.role).toBe("guide");
    expect(new Set(cast.beats.map((b) => b?.role))).toEqual(new Set(speaking));
    expect(cast.tease?.role).toBe("heckler");
  });
  it("runs the serious pair and the usher by default, with no heckler", () => {
    const cast = buildCast(dentalCast, ids, "serious", "pco-dental-clinic")!;
    expect(cast.beats.some((b) => b?.role === "heckler")).toBe(false);
    expect(cast.tease).toBeNull();
    expect(Object.keys(cast.art).sort()).toEqual(["expert", "guide", "usher"]);
    expect(buildCast(dentalCast, ids, "off", "x")).toBeNull();
  });
  it("is steady for a seed and varies between seeds", () => {
    const order = (seed: string) => buildCast(dentalCast, ids, "full", seed)!.beats.map((b) => b?.role).join(",");
    expect(order("a")).toBe(order("a"));
    expect(new Set(["a", "b", "c", "d", "e", "f"].map(order)).size).toBeGreaterThan(1);
  });
});

describe("the cast: one voice at a time", () => {
  const base = { enabled: true, quiet: false, reducedMotion: false, narrating: false, chapterEnded: true, held: false };
  it("never speaks while the narration is playing", () => {
    expect(castVoice({ ...base, narrating: true, chapterEnded: false })).toBe("none");
    expect(castVoice({ ...base, narrating: true })).toBe("none");
  });
  it("lets a character speak once the chapter has ended", () => {
    expect(castVoice(base)).toBe("member");
  });
  it("gives the usher the floor when a scroll is refused", () => {
    expect(castVoice({ ...base, held: true })).toBe("usher");
    expect(castVoice({ ...base, held: true, narrating: true, chapterEnded: false })).toBe("usher");
  });
  it("is silent when turned off, with reduced motion, or with no cast", () => {
    expect(castVoice({ ...base, quiet: true })).toBe("none");
    expect(castVoice({ ...base, reducedMotion: true })).toBe("none");
    expect(castVoice({ ...base, enabled: false })).toBe("none");
    expect(castVoice({ ...base, quiet: true, held: true })).toBe("none");
  });
});

describe("the cast on the PCO story", () => {
  const html = render(pco);
  it("is on stage but silent in the page as served, with a quiet control", () => {
    expect(html).toMatch(/<div class="[^"]*cast[^"]*" data-cast="" data-on="">/);
    expect(html).toMatch(/<button type="button" class="[^"]*quiet[^"]*" data-cast-quiet="" aria-pressed="true">Cast on<\/button>/);
    // Nobody is on stage or speaking until a chapter's narration has ended in the browser.
    expect(html).not.toMatch(/data-speaking|data-shown/);
    expect(html).toMatch(/<p class="[^"]*bubble[^"]*" aria-hidden="true"><\/p>/);
  });
  it("puts no fact only in a bubble: every chapter's words are in the page without the cast", () => {
    const off = render({ ...pco, storyCast: "off" });
    expect(off).not.toContain("data-cast");
    for (const step of dentalJourney) expect(off.replace(/&#x27;/g, "'")).toContain(step.narration);
    expect(off).toMatch(/role="status"><span><\/span><\/p>/);
  });
  it("hides the cast in the stylesheet for reduced motion and when turned off", () => {
    const css = readFileSync(path.join(__dirname, "..", "src", "sections", "cast.module.css"), "utf8");
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \.cast, \.usher \{ display: none !important; \} \}/);
    expect(css).toMatch(/\.cast\[data-quiet\], \.cast:not\(\[data-on\]\) \{ display: none; \}/);
  });
  it("accepts all four roles when a lead asks for them", () => {
    const full = render({ ...pco, storyCast: "full" });
    expect(full).toContain("data-cast");
    expect(() => SiteData.parse({ ...pco, storyCast: "loud" })).toThrow();
  });
});

describe("the rates cast", () => {
  const rateIds = ratesJourney.map((step) => step.id);
  const of = (role: CastRole) => Object.values(ratesCast.members[role].lines).flat().map((l) => l.text).join(" ");
  it("has all four roles as inline drawings with the six faces, and draft lines", () => {
    expect(ratesCast.draft).toBe(true);
    for (const role of castRoles) {
      const art = renderToStaticMarkup(<>{ratesCast.members[role].art}</>);
      expect(art).toMatch(/^<svg viewBox="0 0 120 140" role="img"/);
      for (const face of expressions) expect(art).toContain(`data-face="${face}"`);
      expect(art).not.toMatch(/<image\b|href=|url\(|\.gif|\.png|\.jpg/);
    }
  });
  it("gives the three speaking roles a short line for every chapter", () => {
    for (const role of speaking) for (const id of rateIds) {
      const lines = ratesCast.members[role].lines[id];
      expect(lines?.length, `${role}/${id}`).toBeGreaterThan(0);
      for (const line of lines) expect(line.text.length).toBeLessThanOrEqual(64);
    }
  });
  it("takes every figure from the price list", () => {
    const best = decisionWindows[0];
    const words = of("expert");
    for (const part of [php(monthlyServices[0].monthly), php(annualPay(annualPlans[0])), php(annualWorth(annualPlans[0], best)), `Days ${best.fromDay} to ${best.toDay}: ${best.freeMonths} free months`, percent(MAX_BUNDLE_SAVING), `day ${best.toDay}`]) expect(words).toContain(part);
    // No figure is typed by hand anywhere in the cast.
    const source = readFileSync(path.join(__dirname, "..", "src", "stories", "casts", "rates.tsx"), "utf8");
    const quoted = [...source.matchAll(/text: (["`])((?:(?!\1).)*)\1/g)].map((m) => m[2].replace(/\$\{[^}]*\}/g, ""));
    expect(quoted.length).toBeGreaterThan(25);
    for (const text of quoted) expect(text, text).not.toMatch(/\d/);
  });
  it("keeps the heckler off the visitor, and the host fit for a workplace", () => {
    expect(`${of("heckler")} ${ratesCast.tease.text}`).not.toMatch(/\byou(r|rs)?\b|business/i);
    expect(`${of("guide")} ${of("expert")} ${of("heckler")}`).not.toMatch(/sexy|hot\b|babe|darling|honey|kiss|flirt|wayaway|guarantee/i);
    const label = renderToStaticMarkup(<>{ratesCast.members.guide.art}</>).match(/aria-label="([^"]+)"/)?.[1];
    expect(label).toBe("The host, a presenter with cat ears, in a blazer");
  });
  it("plays the full cast on the rates page, opened and closed by the host", () => {
    const cast = buildCast(ratesCast, rateIds, "full", "ph-rates")!;
    expect(cast.beats[0]?.role).toBe("guide");
    expect(cast.beats[rateIds.length - 1]?.role).toBe("guide");
    expect(new Set(cast.beats.map((b) => b?.role))).toEqual(new Set(speaking));
    const html = renderToStaticMarkup(<PhRatesPage />);
    expect(html).toMatch(/data-cast=""/);
    expect(html).toContain("data-cast-quiet");
    for (const step of ratesJourney) expect(html.replace(/&#x27;/g, "'")).toContain(step.narration);
  });
});
