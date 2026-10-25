// Financial rules are independent of artwork, navigation and presentation.
export const LESSON = Object.freeze({ costPerCupCents: 200, operatingCostCents: 25000, tradingDays: 26 });
export const GUIDED = Object.freeze({ cups: 100, priceCents: 500 });
export const PROMOTION = Object.freeze({ kind: 'percent-off', percent: 10 });
export const DEFAULT_EXPERIMENT = Object.freeze({ cups: 140, extraStaffCents: 0 });
export const STAFF_OPTIONS = Object.freeze([0, 5000, 10000, 15000]);

function integer(value, name, min = 0, max = 100000000) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError(`${name} is outside the supported range.`);
  return value;
}

export function moneyToCents(value) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new RangeError('Enter a dollar amount with up to two decimal places.');
  const [whole, fraction = ''] = text.split('.');
  return integer(Number(whole) * 100 + Number(fraction.padEnd(2, '0')), 'Price');
}

export function validateSetup({ cups, priceCents }) {
  integer(cups, 'Cups', 80, 180);
  integer(priceCents, 'Price', 300, 1000);
  if (cups % 10 !== 0) throw new RangeError('Use 80–180 cups, in steps of 10.');
  if (priceCents % 50 !== 0) throw new RangeError('Use $3–$10, in steps of $0.50.');
  return Object.freeze({ cups, priceCents });
}

export function validateExperiment({ cups, extraStaffCents, priceCents }) {
  integer(cups, 'Cups', 80, 180);
  if (cups % 10 !== 0) throw new RangeError('Use 80–180 cups, in steps of 10.');
  if (!STAFF_OPTIONS.includes(extraStaffCents)) throw new RangeError('Choose an available staffing cost.');
  if (priceCents !== undefined) {
    integer(priceCents, 'Promotion price', 300, 1000);
    if (priceCents % 50 !== 0) throw new RangeError('Use a promotion price of $3–$10, in steps of $0.50.');
  }
  return Object.freeze({ cups, extraStaffCents, ...(priceCents !== undefined ? { priceCents } : {}) });
}

// The lesson selects 10%; the rule accepts other percentages without UI changes.
// Other promotion kinds can be added here without changing the day ledger.
export function promotionalPrice(priceCents, promotion = PROMOTION) {
  integer(priceCents, 'Price');
  if (promotion?.kind !== 'percent-off') throw new RangeError('Unsupported promotion type.');
  integer(promotion.percent, 'Discount', 0, 100);
  // Round the discounted unit price once, then multiply by completed cups.
  return Math.round(priceCents * (100 - promotion.percent) / 100);
}

export function calculateDay({ cups, priceCents, extraStaffCents = 0,
  costPerCupCents = LESSON.costPerCupCents, operatingCostCents = LESSON.operatingCostCents }) {
  integer(cups, 'Cups', 0, 1000000);
  for (const [name, value] of Object.entries({ priceCents, extraStaffCents, costPerCupCents, operatingCostCents })) integer(value, name);
  const revenueCents = cups * priceCents;
  const variableCostCents = cups * costPerCupCents;
  const totalCostCents = variableCostCents + operatingCostCents + extraStaffCents;
  const profitCents = revenueCents - totalCostCents;
  if (![revenueCents, totalCostCents, profitCents].every(Number.isSafeInteger)) throw new RangeError('Totals exceed the supported range.');
  return Object.freeze({ cups, priceCents, costPerCupCents, operatingCostCents, extraStaffCents,
    revenueCents, variableCostCents, totalCostCents, profitCents });
}

export function compareDays(day, baseline) {
  const differenceCents = day.profitCents - baseline.profitCents;
  return Object.freeze({ differenceCents,
    outcome: day.profitCents > 0 ? 'profit' : day.profitCents < 0 ? 'loss' : 'break-even',
    comparison: differenceCents > 0 ? 'better' : differenceCents < 0 ? 'worse' : 'same' });
}

export function runPromotion(setup, experiment, promotion = PROMOTION) {
  const baseline = calculateDay(validateSetup(setup));
  const inputs = validateExperiment(experiment);
  const priceBeforeDiscountCents = inputs.priceCents ?? baseline.priceCents;
  const day = calculateDay({ ...inputs, priceCents: promotionalPrice(priceBeforeDiscountCents, promotion) });
  return Object.freeze({ baseline, day, inputs, priceBeforeDiscountCents,
    promotion: Object.freeze({ ...promotion }), ...compareDays(day, baseline) });
}

export function monthlyEstimate(day, tradingDays = LESSON.tradingDays) {
  integer(tradingDays, 'Trading days', 1, 366);
  const result = { tradingDays };
  for (const key of ['revenueCents', 'variableCostCents', 'operatingCostCents', 'extraStaffCents', 'totalCostCents', 'profitCents']) {
    result[key] = day[key] * tradingDays;
    if (!Number.isSafeInteger(result[key])) throw new RangeError('Monthly total exceeds the supported range.');
  }
  return Object.freeze(result);
}
