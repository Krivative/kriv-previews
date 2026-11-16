import { loreUnits, seedNumber, type JourneyGenre, type JourneyLore } from "@/stories/journey-style";
import { dress, genres } from "./genres";
import type { CastBeat, CastFile, CastLine, CastMode, CastRole, Expression, Move, StageCast } from "./types";

export * from "./types";

// How each role carries itself when a line does not say otherwise.
const manner: Record<CastRole, { face: Expression; move: Move }> = {
  guide: { face: "happy", move: "point" },
  expert: { face: "thinking", move: "nod" },
  heckler: { face: "cheeky", move: "shrug" },
  usher: { face: "neutral", move: "hop" },
};

const beat = (file: CastFile, role: CastRole, line: CastLine, title = ""): CastBeat => ({ role, name: `${file.members[role].name}${title}`, text: line.text, face: line.face ?? manner[role].face, move: line.move ?? manner[role].move });

/**
 * Casts a story: at most one appearance per chapter. The guide opens and closes;
 * in between the speaking roles take turns, in an order set by the seed, so two
 * sites with the same cast do not play the same show.
 */
export function buildCast(file: CastFile, chapterIds: string[], mode: CastMode, seed: string, costume?: { genre: JourneyGenre; lore: JourneyLore }): StageCast | null {
  if (mode === "off") return null;
  // The costume: a title after each name, one small prop on each drawing, and the usher's wording. The lines themselves never change.
  const genre = costume && costume.genre !== "plain" ? genres[costume.genre] : null;
  const title = (role: CastRole) => (genre ? `, ${genre.titles[role]}` : "");
  const wear = (role: CastRole) => (genre ? dress(file.members[role].art, genre.props[role]) : file.members[role].art);
  const speaking: CastRole[] = mode === "full" ? ["guide", "expert", "heckler"] : ["guide", "expert"];
  const start = seedNumber(`cast:${seed}`);
  const beats = chapterIds.map((id, n) => {
    const edge = n === 0 || n === chapterIds.length - 1;
    // Try the role whose turn it is, then the others, so a chapter is silent only if nobody has a line for it.
    const order = edge ? ["guide" as const, ...speaking] : speaking.map((_, k) => speaking[(start + n + k) % speaking.length]);
    for (const role of order) {
      const lines = file.members[role].lines[id];
      if (lines?.length) return beat(file, role, lines[seedNumber(`line:${seed}:${id}`) % lines.length], title(role));
    }
    return null;
  });
  const art: StageCast["art"] = { usher: wear("usher") };
  for (const role of speaking) art[role] = wear(role);
  const words = genre && costume ? genre.words(loreUnits[costume.lore]) : undefined;
  return { beats, art, tease: mode === "full" ? beat(file, "heckler", file.tease, title("heckler")) : null, end: file.end, usherName: `${file.members.usher.name}${title("usher")}`, words };
}

/**
 * Who may speak right now. One voice at a time: nobody from the cast speaks
 * while a chapter's narration is still playing, and the usher's notice about
 * the visitor's own action comes before any chapter line.
 */
export function castVoice(s: { enabled: boolean; quiet: boolean; reducedMotion: boolean; narrating: boolean; chapterEnded: boolean; held: boolean }): "none" | "usher" | "member" {
  if (!s.enabled || s.quiet || s.reducedMotion) return "none";
  if (s.held) return "usher";
  return s.chapterEnded && !s.narrating ? "member" : "none";
}
