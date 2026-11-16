// "The story of one tooth": the scroll journey on a dental lead's home page
// (preview-only). General, well-established dental facts only. Nothing here is
// a claim about the clinic, its dentists, its results or its prices. Lines in
// [BRACKETS] are slots for the dentists' own words.
// `audio` is an optional recorded voice-over for the chapter (a file under public/).
// Without it, the visitor's device reads the narration aloud when narration is on.
export type JourneyStep = { id: string; chapter: string; title: string; narration: string; note?: string; audio?: string };

// Recorded voice-over ("Mira", fifth set, supplied by Kriv on 2026-11-16; what she says is in
// docs/voices/dental-story-script.txt, the voice settings in docs/voices/dental-story-voice-profile.txt).
// The voice EXPLAINS the screen in its own words; it no longer reads the title and narration.
// Two things must stay true: the page and the spoken script never contradict each other on a fact,
// and when a recording cannot play, the device voice reads the on-screen title and narration instead.
// The ?v= number changes with each new set, so browsers fetch the new files. "/for" is the app's base path.
const voice = (name: string) => `/for/audio/pco-journey/${name}.mp3?v=6`;

export const dentalJourney: JourneyStep[] = [
  { id: "smile", audio: voice("01-smile"), chapter: "The start", title: "Every smile has a story.", narration: "Scroll down and follow one tooth through an ordinary day. It is a short story about why looking after it matters." },
  { id: "tooth", audio: voice("02-tooth"), chapter: "The tooth", title: "Built for a lifetime of work.", narration: "Enamel, the outer layer of a tooth, is the hardest tissue in the human body. It has to be. It bites, chews and grinds every single day." },
  { id: "meal", audio: voice("03-meal"), chapter: "The day", title: "It works at every meal.", narration: "Each bite leaves a little behind. Sugars and starches feed the bacteria that live in every mouth." },
  { id: "plaque", audio: voice("04-plaque"), chapter: "The film", title: "A quiet film forms.", narration: "That film is called plaque. Left alone, it hardens into tartar, which a toothbrush can no longer remove." },
  { id: "spot", audio: voice("05-spot"), chapter: "The spot", title: "Trouble starts small.", narration: "Acids made in plaque can wear a tiny spot into the enamel. At first there is usually nothing to feel." },
  { id: "checkup", audio: voice("06-checkup"), chapter: "The check-up", title: "A dentist sees what you cannot.", narration: "A check-up looks for small changes early, when they are usually simpler to look after. A professional cleaning removes the tartar that brushing leaves behind.", note: "[DENTIST'S NOTE: one or two lines in the dentist's own words about what a first visit is like.]" },
  { id: "home", audio: voice("07-home"), chapter: "At home", title: "Two minutes, twice a day.", narration: "Brushing with fluoride toothpaste and cleaning between the teeth keeps plaque from settling in between visits." },
  { id: "again", audio: voice("08-again"), chapter: "The smile", title: "And the story goes on.", narration: "Looked after, a tooth can keep doing its work for decades. That is what a dental clinic is for.", note: "[THE CLINIC'S OWN CHAPTER: the dentists can rewrite any line of this story, or add their own.]" },
];
