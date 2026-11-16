import { crm, monthlyServices, addOns, php, yearly } from "@/offers/ph-local";
import { ratesJourney } from "@/stories/rates-journey";
import r from "./roadside.module.css";

// The rates story as a walk down one road, Street View style (Kriv, 2026-11-16). From stop 2 on:
// - a route strip along the bottom with all ten stops and a "you are here" marker that walks with the
//   visitor (driven by --journey-t and data-step, set by JourneyScroller; no script of its own);
// - at the bazaar (stop 3), each service stands at its stall like a place card on a street map.
// Decoration over the same facts the chapter text states: prices come from src/offers/ph-local.ts.
const price = (name: string) => monthlyServices.find((s) => s.name === name)?.monthly ?? 0;
const stalls = [
  { name: "Website", price: price("Website"), line: "Your shop window online, built and looked after." },
  { name: "Content creation", price: price("Content creation"), line: "Posts made for you, approved before they go out." },
  { name: "AI live seller", price: price("AI live seller"), line: "Sells your items online around the clock; an AI manager logs every order." },
  { name: "CRM and automations", price: crm.promoMonthly, line: "Every inquiry in one place; follow-ups send themselves." },
  { name: addOns[1].name, price: addOns[1].price, line: "Handles repeat steps, in wording you approve." },
];

/** Street View style forward arrows on the road: one per stop, shown for the stop in view. Each is a plain
 *  link to the next stop, so the story's own hold still applies (a stop opens when its narration ends). */
export function RoadArrows() {
  return <nav className={r.arrows} aria-label="Walk to the next stop">
    <div className={r.arrowWindow}>
      {ratesJourney.map((step, n) => {
        const next = ratesJourney[n + 1];
        const href = next ? `#journey-${next.id}` : "#offer-builder";
        const label = next ? `Walk on: ${next.chapter}` : "Build your plan";
        return <a key={step.id} className={r.arrow} data-arrow={n} href={href} aria-label={label}>
          <span className={r.chevron} aria-hidden="true"><svg viewBox="0 0 60 40"><path d="M8 32 L30 10 L52 32" /></svg></span>
          <span className={r.arrowLabel}>{label}</span>
        </a>;
      })}
    </div>
  </nav>;
}

export function Roadside() {
  return <div className={r.roadside} aria-hidden="true">
    <div className={r.window}>
      <div className={r.pins}>
        {stalls.map((s, n) => <div key={s.name} className={r.pin} data-pin={n} style={{ "--n": n } as React.CSSProperties}>
          <span className={r.dot} />
          <span className={r.card}><b>{s.name}</b><em>{php(yearly(s.price))} a year</em><small>About {php(s.price)} a month</small><small>{s.line}</small></span>
        </div>)}
      </div>
      <div className={r.route}>
        <div className={r.road}>
          {ratesJourney.map((step, n) => <span key={step.id} className={r.stop} data-stop={n} style={{ left: `${(n / (ratesJourney.length - 1)) * 100}%` }} />)}
          <span className={r.you}><span>You</span></span>
        </div>
        <p className={r.names}>{ratesJourney.map((step, n) => <span key={step.id} data-name={n}>Stop {n + 1} of {ratesJourney.length}: {step.chapter}</span>)}</p>
      </div>
    </div>
  </div>;
}
