import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDay, compareDays, runPromotion, promotionalPrice, monthlyEstimate,
  moneyToCents, validateSetup, validateExperiment, GUIDED } from '../src/model.js';

test('normal day reconciles revenue, both cost groups and profit', () => {
  const day = calculateDay(GUIDED);
  assert.equal(day.revenueCents, 50000);
  assert.equal(day.variableCostCents, 20000);
  assert.equal(day.totalCostCents, 45000);
  assert.equal(day.profitCents, 5000);
});

for (const [cups, extraStaffCents, profit, outcome, comparison] of [
  [140, 0, 10000, 'profit', 'better'], [110, 0, 2500, 'profit', 'worse'],
  [120, 0, 5000, 'profit', 'same'], [100, 0, 0, 'break-even', 'worse'],
  [140, 5000, 5000, 'profit', 'same'], [140, 10000, 0, 'break-even', 'worse'],
  [140, 15000, -5000, 'loss', 'worse']
]) test(`${cups} cups and ${extraStaffCents} staff cents: ${outcome}, ${comparison}`, () => {
  const run = runPromotion(GUIDED, { cups, extraStaffCents });
  assert.equal(run.day.profitCents, profit);
  assert.equal(run.outcome, outcome);
  assert.equal(run.comparison, comparison);
  assert.equal(run.differenceCents, profit - 5000);
});

test('custom baseline determines price and comparison, including a losing baseline', () => {
  const run = runPromotion({ cups: 80, priceCents: 300 }, { cups: 140, extraStaffCents: 0 });
  assert.equal(run.baseline.profitCents, -17000);
  assert.equal(run.day.priceCents, 270);
  assert.equal(run.day.profitCents, -15200);
  assert.equal(run.outcome, 'loss');
  assert.equal(run.comparison, 'better');
  assert.equal(run.differenceCents, 1800);
});

test('percentage rule is reusable and rounds the unit price once', () => {
  assert.equal(promotionalPrice(555, { kind: 'percent-off', percent: 10 }), 500);
  assert.equal(promotionalPrice(500, { kind: 'percent-off', percent: 25 }), 375);
  assert.equal(promotionalPrice(500, { kind: 'percent-off', percent: 100 }), 0);
  assert.equal(promotionalPrice(500, { kind: 'percent-off', percent: 0 }), 500);
  assert.throws(() => promotionalPrice(500, { kind: 'coupon', percent: 10 }));
  for (const percent of [-1, 101, NaN, 1.5]) assert.throws(() => promotionalPrice(500, { kind: 'percent-off', percent }));
});

test('every supported setup has an exact discounted unit price and consistent ledger', () => {
  for (let cups = 80; cups <= 180; cups += 10) for (let priceCents = 300; priceCents <= 1000; priceCents += 50) {
    const run = runPromotion({ cups, priceCents }, { cups: 140, extraStaffCents: 5000 });
    assert.equal(run.day.priceCents, priceCents * 0.9);
    assert.equal(run.day.revenueCents - run.day.totalCostCents, run.day.profitCents);
  }
});

test('repeated runs never mutate the baseline or append sales/costs', () => {
  const setup = { ...GUIDED };
  const inputs = { cups: 140, extraStaffCents: 0 };
  const first = runPromotion(setup, inputs);
  const second = runPromotion(setup, inputs);
  assert.deepEqual(first, second);
  inputs.cups = 80;
  assert.equal(first.inputs.cups, 140);
  assert.deepEqual(setup, GUIDED);
  assert.ok(Object.isFrozen(first.day));
});

test('monthly estimate multiplies all included financial lines, including losses', () => {
  for (const staff of [0, 15000]) {
    const day = runPromotion(GUIDED, { cups: 140, extraStaffCents: staff }).day;
    const month = monthlyEstimate(day);
    assert.equal(month.profitCents, staff ? -130000 : 260000);
    assert.equal(month.revenueCents - month.totalCostCents, month.profitCents);
    assert.equal(month.totalCostCents, month.variableCostCents + month.operatingCostCents + month.extraStaffCents);
  }
});

test('invalid, fractional and missing inputs cannot become zero silently', () => {
  for (const text of ['', ' ', 'abc', 'Infinity', '-5', '4.999']) assert.throws(() => moneyToCents(text));
  assert.equal(moneyToCents('5.5'), 550);
  assert.equal(moneyToCents(' 5.00 '), 500);
  for (const cups of [0, 79, 85, 181, NaN, Infinity, undefined]) assert.throws(() => validateSetup({ cups, priceCents: 500 }));
  for (const priceCents of [299, 325, 1001, NaN]) assert.throws(() => validateSetup({ cups: 100, priceCents }));
  assert.throws(() => validateExperiment({ cups: 140, extraStaffCents: 1 }));
  assert.equal(compareDays(calculateDay({ cups: 0, priceCents: 500 }), calculateDay(GUIDED)).outcome, 'loss');
});
