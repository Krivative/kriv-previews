// "The story of one tooth": the scroll journey on a dental lead's home page
// (preview-only). General, well-established dental facts only. Nothing here is
// a claim about the clinic, its dentists, its results or its prices. Lines in
// [BRACKETS] are slots for the dentists' own words.
// `audio` is an optional recorded voice-over for the chapter (a file under public/).
// Without it, the visitor's device reads the narration aloud when narration is on.
export type JourneyStep = { id: string; chapter: string; title: string; narration: string; note?: string; audio?: string };

export const dentalJourney: JourneyStep[] = [
  { id: "smile", chapter: "The start", title: "Every smile has a story.", narration: "Scroll down and follow one tooth through an ordinary day. It is a short story about why looking after it matters." },
  { id: "tooth", chapter: "The tooth", title: "Built for a lifetime of work.", narration: "Enamel, the outer layer of a tooth, is the hardest tissue in the human body. It has to be. It bites, chews and grinds every single day." },
  { id: "meal", chapter: "The day", title: "It works at every meal.", narration: "Each bite leaves a little behind. Sugars and starches feed the bacteria that live in every mouth." },
  { id: "plaque", chapter: "The film", title: "A quiet film forms.", narration: "That film is called plaque. Left alone, it hardens into tartar, which a toothbrush can no longer remove." },
  { id: "spot", chapter: "The spot", title: "Trouble starts small.", narration: "Acids made in plaque can wear a tiny spot into the enamel. At first there is usually nothing to feel." },
  { id: "checkup", chapter: "The check-up", title: "A dentist sees what you cannot.", narration: "A check-up looks for small changes early, when they are usually simpler to look after. A professional cleaning removes the tartar that brushing leaves behind.", note: "[DENTIST'S NOTE: one or two lines in the dentist's own words about what a first visit is like.]" },
  { id: "home", chapter: "At home", title: "Two minutes, twice a day.", narration: "Brushing with fluoride toothpaste and cleaning between the teeth keeps plaque from settling in between visits." },
  { id: "again", chapter: "The smile", title: "And the story goes on.", narration: "Looked after, a tooth can keep doing its work for decades. That is what a dental clinic is for.", note: "[THE CLINIC'S OWN CHAPTER: the dentists can rewrite any line of this story, or add their own.]" },
];
