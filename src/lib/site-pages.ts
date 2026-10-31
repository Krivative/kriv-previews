import type { SiteData } from "./site-schema";

// Visitor guidance, not promises about a business. Business facts live in SiteData.
export const nicheGuides = {
  dental: { label: "Care", heading: "Make room for your questions.", prepare: "Think about your concerns, previous care and what you would like to discuss.", questions: ["Which care options are appropriate for me?", "What should I bring to my appointment?", "How are fees and follow-up visits explained?"] },
  aesthetic: { label: "Treatments", heading: "Start with an informed conversation.", prepare: "Note your goals and questions before discussing any treatment.", questions: ["Is this treatment suitable for my goals?", "What are the risks and recovery considerations?", "What is included in the consultation and price?"] },
  chiro: { label: "Care", heading: "A little preparation goes a long way.", prepare: "Write down your concerns, relevant history and questions for a first visit.", questions: ["What does a first visit involve?", "Which care options might be appropriate?", "How are costs and follow-up visits discussed?"] },
  hvac: { label: "Services", heading: "A clearer path to your next step.", prepare: "Have the equipment details and a description of the issue ready to discuss.", questions: ["What is included in an assessment?", "How are repair and replacement options compared?", "What should I confirm about timing, costs and coverage?"] },
  plumbing: { label: "Services", heading: "Know what to ask before work begins.", prepare: "Describe the issue, its location and when you first noticed it.", questions: ["What information helps define the scope of work?", "How are access, timing and costs confirmed?", "What should I ask about the proposed repair?"] },
  auto: { label: "Services", heading: "Bring the details. Ask the questions.", prepare: "Note the vehicle model, symptoms and any relevant service history.", questions: ["What is included in the inspection?", "How is proposed work explained before approval?", "What should I ask about parts, costs and timing?"] },
  cafe: { label: "Menu", heading: "Plan your next coffee stop.", prepare: "Browse the menu and check the published hours before heading over.", questions: ["Which menu items fit my dietary preferences?", "Should I call ahead for a larger order?", "What should I know before visiting?"] },
  restaurant: { label: "Menu", heading: "A little planning for a good gathering.", prepare: "Consider the occasion, group size and any dietary requirements.", questions: ["Which dishes suit my dietary requirements?", "Should I ask about a table for my group?", "What details help with a special occasion?"] },
  salon: { label: "Services", heading: "Find a direction that feels like you.", prepare: "Bring your ideas and note your routine, preferences and previous services.", questions: ["Which service suits the look I have in mind?", "How much time should I allow?", "What should I ask about pricing and upkeep?"] },
  spa: { label: "Experiences", heading: "Make time for the details, too.", prepare: "Consider your preferences and any concerns you want to discuss before a visit.", questions: ["Which experience suits my preferences?", "What should I know before arriving?", "How are duration, pricing and suitability explained?"] },
  gym: { label: "Training", heading: "Find your starting point.", prepare: "Think about your goals, current routine and preferred way to train.", questions: ["Which training options fit my starting point?", "What should I ask about schedules and access?", "What is included in a membership or session?"] },
  office: { label: "Expertise", heading: "Bring clarity to your next decision.", prepare: "Outline the support you need and gather the relevant questions and documents.", questions: ["Which area of expertise fits my needs?", "What information should I prepare?", "How are scope, fees and next steps agreed?"] },
  resort: { label: "Experiences", heading: "Picture the stay. Plan the details.", prepare: "Have your preferred dates, group size and travel preferences in mind.", questions: ["Which stay or experience suits my group?", "What should I confirm about access and inclusions?", "How are availability, rates and policies confirmed?"] },
};

export function guideFor(site: SiteData) {
  const niche = (site.contentNiche ?? site.template.split("-")[0]) as keyof typeof nicheGuides;
  return nicheGuides[niche] ?? { label: "Services", heading: "Plan your next step.", prepare: "Browse the information and make a note of your questions.", questions: ["Which option is right for me?", "What should I know before deciding?", "How can I confirm the details?"] };
}

export type SitePage = { path: string; title: string; kind: "home" | "services" | "service" | "about" | "contact" | "faq" | "gallery"; serviceIndex?: number };

export function sitePages(site: SiteData): SitePage[] {
  const pages: SitePage[] = [{ path: "", title: "Home", kind: "home" }];
  if (site.services?.items.length) pages.push({ path: "services", title: guideFor(site).label, kind: "services" });
  if (site.about) pages.push({ path: "about", title: "About", kind: "about" });
  if (site.gallery && (site.gallery.labels.length || site.brand.photos.length)) pages.push({ path: "gallery", title: "Gallery", kind: "gallery" });
  if (site.faqs.length) pages.push({ path: "faq", title: "Questions", kind: "faq" });
  pages.push({ path: "contact", title: "Contact", kind: "contact" });
  const used = new Set<string>();
  site.services?.items.forEach((item, serviceIndex) => {
    const stem = item.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64).replace(/-$/, "") || "item";
    let key = stem;
    for (let suffix = 2; used.has(key); suffix++) key = `${stem}-${suffix}`;
    used.add(key);
    pages.push({ path: `services/${key}`, title: item.name, kind: "service", serviceIndex });
  });
  return pages;
}

// next/link applies the configured basePath; never build a link from supplied hrefs.
export function pageHref(site: SiteData, path = "") {
  return `/${site.slug}${path ? `/${path}` : ""}`;
}
