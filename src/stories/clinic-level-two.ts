// Recorded voice-over for level two of a dental story site ("Mira", supplied by Kriv on 2026-11-16;
// what she says is in docs/voices/dental-level-two-script.txt). One line per stop, keyed by the stop's id.
// The voice explains the map; it does not read the stop's text, and it must never state a fact about
// the clinic that the page does not. The ?v= number changes with each new set.
const voice = (name: string) => `/for/audio/pco-level-two/${name}.mp3?v=1`;

export const levelTwoVoice: Record<string, string> = {
  inside: voice("l2-01-inside"),
  services: voice("l2-02-services"),
  about: voice("l2-03-team"),
  book: voice("l2-04-book"),
  visit: voice("l2-05-visit"),
  social: voice("l2-06-social"),
  faq: voice("l2-07-faq"),
};
