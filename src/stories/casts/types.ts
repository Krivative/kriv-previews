import type { ReactNode } from "react";

// The cast of a story site (preview-only): four small characters that react to
// the scene, to each other and to what the visitor does. See docs/STORY-CAST.md.
//
//   guide    serious   points at the part of the drawing that matters and names it
//   expert   serious   adds one true, general fact
//   heckler  playful   teases the frame or the other characters, never the visitor
//   usher    dry       speaks only about what the visitor does (the lock, the next-chapter cue, the end)
//
// A cast is decoration: no fact may appear only in a bubble.

export const castRoles = ["guide", "expert", "heckler", "usher"] as const;
export type CastRole = (typeof castRoles)[number];
export const expressions = ["neutral", "happy", "surprised", "thinking", "cheeky", "concerned"] as const;
export type Expression = (typeof expressions)[number];
export const moves = ["wave", "point", "nod", "shrug", "peek", "hop"] as const;
export type Move = (typeof moves)[number];

/** off: no cast. serious: guide, expert and usher (the default on client sites). full: all four. */
export const castModes = ["off", "serious", "full"] as const;
export type CastMode = (typeof castModes)[number];

export type CastLine = { text: string; face?: Expression; move?: Move };
export type CastMember = { role: CastRole; name: string; art: ReactNode; lines: Record<string, CastLine[]> };
export type CastFile = {
  story: string;
  /** Lines stay drafts until the client has approved them. */
  draft: boolean;
  members: Record<CastRole, CastMember>;
  /** The heckler's one tease when the visitor tries to go backwards. About the act, never the person. */
  tease: CastLine;
  /** The usher's line when the last chapter has finished. */
  end: string;
};

/** One appearance: who steps out for a chapter and what they say. */
export type CastBeat = { role: CastRole; name: string; text: string; face: Expression; move: Move };
/** What the story engine needs on stage: one beat per chapter, the drawings, and the usher's extras. */
export type StageCast = { beats: (CastBeat | null)[]; art: Partial<Record<CastRole, ReactNode>>; tease: CastBeat | null; end: string; usherName: string };
