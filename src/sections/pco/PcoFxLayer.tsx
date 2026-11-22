import { PhBackdrop } from "@/sections/PhBackdrop";
import { PhLayer } from "@/sections/PhLayers";
import type { PcoLayer } from "./pco-fx";

// One moving background from the effects arsenal, in PCO's colours (set as tokens on the page wrapper).
export function PcoFxLayer({ kind }: { kind: PcoLayer }) {
  if (kind === "contour" || kind === "halftone") return <PhBackdrop kind={kind} word={false} />;
  return <PhLayer kind={kind} />;
}
