import { Fragment } from "react";

// Headline text with *accent* words: the starred part renders in the template's italic
// accent face and colour ("Every journey begins *with a moment.*"). Stars never show.
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <>
      {parts.map((p, i) => (i % 2 ? <em key={i}>{p}</em> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

/** The plain text of a Rich string, for titles, alt text and metadata. */
export const plain = (text: string) => text.replace(/\*([^*]+)\*/g, "$1");
