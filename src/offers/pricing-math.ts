import type { Market, PricePackage } from "./pricing";

export const money = (amount: number, currency: Market["currency"], fractionDigits = 0) =>
  new Intl.NumberFormat(currency === "PHP" ? "en-PH" : "en-US", { style: "currency", currency, minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(amount);

export function quoteWindow(monthly: number, paidMonths: number, freeMonths: number, annualDiscount: number) {
  const annualBaseline = monthly * paidMonths;
  const payment = annualBaseline * (1 - annualDiscount);
  const covered = paidMonths + freeMonths;
  const effective = Math.round(payment / covered);
  const equivalent = covered * monthly;
  return { annualBaseline, payment, covered, effective, equivalent, savings: equivalent - payment, percent: monthly ? Math.round((1 - payment / equivalent) * 100) : 0 };
}

export function coveredItems(market: Market, plan: PricePackage) {
  return new Set(plan.includes.flatMap((id) => [id, ...market.items[id].upgrades ?? []]));
}

export function selectionTotal(market: Market, selected: string[]) {
  const unique = [...new Set(selected)].filter((id) => Object.hasOwn(market.items, id));
  for (const id of [...unique]) {
    const required = market.items[id].requires;
    if (required && !unique.includes(required)) unique.push(required);
  }
  return unique.filter((id) => !unique.some((other) => other !== id && market.items[other].upgrades?.includes(id))).reduce((sum, id) => ({
    monthly: sum.monthly + market.items[id].monthly,
    setup: sum.setup + (market.items[id].setup ?? 0),
  }), { monthly: 0, setup: 0 });
}

export function packageSavings(market: Market, selected: string[], total: ReturnType<typeof selectionTotal>) {
  return market.packages.filter((plan) => {
    const included = coveredItems(market, plan);
    const setup = plan.setup ?? 0;
    return selected.length > 0 && selected.every((id) => included.has(id))
      && setup <= total.setup && plan.monthly <= total.monthly
      && (setup < total.setup || plan.monthly < total.monthly);
  }).sort((a, b) => a.monthly - b.monthly || (a.setup ?? 0) - (b.setup ?? 0))[0];
}
