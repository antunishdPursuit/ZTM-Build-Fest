import { GUIDED, PROMOTION, DEFAULT_EXPERIMENT, STAFF_OPTIONS, LESSON,
  calculateDay, validateSetup, validateExperiment, moneyToCents, runPromotion,
  promotionalPrice, monthlyEstimate } from './model.js';

const app = document.querySelector('#app');
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const money = cents => usd.format(cents / 100);
const wholeMoney = cents => Number.isInteger(cents / 100) ? money(cents).replace('.00', '') : money(cents);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const freshDraft = () => ({ cups: String(DEFAULT_EXPERIMENT.cups), staffing: '0' });
const state = { screen: 'welcome', mode: 'guided', setup: GUIDED,
  setupDraft: { cups: '100', price: '5.00' }, drafts: { guided: freshDraft(), explore: freshDraft() },
  runs: { guided: null, explore: null }, dirty: { guided: true, explore: true }, prediction: null };
const baseline = () => calculateDay(state.setup);
const demonstration = () => runPromotion(state.setup, DEFAULT_EXPERIMENT);
const button = (action, label, primary = false) => `<button type="button" data-action="${action}" class="${primary ? 'primary' : 'text-button'}">${label}</button>`;
const heading = text => `<h1 id="main-heading" tabindex="-1">${text}</h1>`;
const figures = entries => `<dl class="figures">${entries.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
const costs = () => `<details><summary>Cost assumptions</summary><p>${money(LESSON.costPerCupCents)} per cup; ${wholeMoney(LESSON.operatingCostCents)} daily operating costs, including base staffing.</p></details>`;
function ledger(day, label = 'Daily breakdown') {
  return `<table class="ledger"><caption>${label}</caption><tbody>${[
    ['Revenue', day.revenueCents], ['Ingredients & packaging', day.variableCostCents],
    ['Base staffing, rent & utilities', day.operatingCostCents], ['Extra staffing', day.extraStaffCents],
    ['Total costs', day.totalCostCents], ['Profit after these costs', day.profitCents]
  ].map(([key, value], index) => `<tr class="${index >= 4 ? 'total' : ''}"><th scope="row">${key}</th><td>${wholeMoney(value)}</td></tr>`).join('')}</tbody></table>`;
}
function header(title) {
  return `<header class="header"><button class="brand" data-action="home" type="button" aria-label="Anna’s Tea — back to welcome">Anna’s Tea</button><div class="header-side">${heading(title)}${button('restart', 'Restart lesson')}</div></header>`;
}
function scene(hotspot = '') {
  return `<div class="scene"><img src="assets/working-shop.png" alt="Anna takes an order while her employee prepares bubble tea behind the counter."><p class="image-fallback">Anna takes orders. Her employee prepares the tea. The lesson’s figures and explanations are available below.</p>${hotspot ? `<button class="hotspot" type="button" data-action="detail" aria-expanded="false" aria-controls="scene-detail">${hotspot}</button>` : ''}</div>`;
}
function frame(title, content, nextAction, nextLabel, backAction, hotspot = '', detail = '') {
  return `<div class="shell">${header(title)}${scene(hotspot)}<section class="lesson-bottom"><div class="lesson-copy">${content}${detail ? `<p id="scene-detail" class="detail-copy" hidden>${detail}</p>` : ''}</div><nav class="navigation" aria-label="Lesson navigation">${button(backAction, 'Back')}${button(nextAction, nextLabel, true)}</nav></section></div>`;
}
function welcome() {
  const guided = state.mode === 'guided';
  return `<section class="hero home-hero"><div class="hero-copy">
    ${heading('Welcome to<br>Anna’s Tea')}
    <p class="hero-purpose">Learn business analytics by following a shop’s money.</p>
    <p class="hero-explanation">See what comes in, what goes out, and whether a promotion leaves the shop better off.</p>
    <a class="primary" href="#learn">Choose how to learn</a>
  </div></section>
  <section class="home-setup" aria-labelledby="learn"><div class="learning-outcomes">
    <h2 id="learn" tabindex="-1">A first lesson in<br>business analytics.</h2>
    <ul><li>Understand revenue, costs and profit.</li><li>Compare a normal day with a promotion.</li><li>Test when more sales stop helping.</li></ul>
  </div><form class="setup-form" id="setup-form" aria-label="Lesson setup">
    <div class="mode" role="group" aria-label="Learning mode"><button type="button" data-action="guided" aria-pressed="${guided}">Guided lesson</button><button type="button" data-action="explore" aria-pressed="${!guided}">Explore</button></div>
    <p class="mode-description">${guided ? 'Follow the lesson, then try your own changes.' : 'Set your normal day, then test a promotion.'}</p>
    <div class="fields"><div class="field"><label for="setup-cups">Cups per day</label>${guided ? '<output id="setup-cups">100</output>' : `<input id="setup-cups" name="cups" type="number" min="80" max="180" step="10" required value="${escape(state.setupDraft.cups)}">`}</div><div class="field"><label for="setup-price">Price per cup</label>${guided ? '<output id="setup-price">$5.00</output>' : `<input id="setup-price" name="price" type="number" min="3" max="10" step="0.5" required value="${escape(state.setupDraft.price)}">`}</div></div>
    ${costs()}<p class="error" id="setup-error" role="alert"></p>
    <button type="submit" class="primary">${guided ? 'Start lesson' : 'Explore shop'}</button>
  </form></section>`;
}
function guidedScreen() {
  const day = baseline();
  const promo = demonstration();
  const price = money(promo.day.priceCents);
  switch (state.screen) {
    case 'normal': return frame('A normal day', `${figures([['Cups sold', day.cups], ['Price per cup', money(day.priceCents)], ['Revenue', wholeMoney(day.revenueCents)]])}<p class="narration">${day.cups} cups × ${wholeMoney(day.priceCents)} = ${wholeMoney(day.revenueCents)} in sales.</p>`, 'costs', 'See costs', 'home', 'Sales', 'Anna takes payment for each completed cup. Revenue is the money from those sales, before costs.');
    case 'costs': return frame('Where the money goes', `${figures([['Revenue', wholeMoney(day.revenueCents)], ['Total costs', wholeMoney(day.totalCostCents)], ['Profit', wholeMoney(day.profitCents)]])}<p class="narration">${wholeMoney(day.variableCostCents)} for cups and ingredients. ${wholeMoney(day.operatingCostCents)} to run the shop. ${wholeMoney(day.profitCents)} remains.</p><details><summary>Cost breakdown</summary>${ledger(day)}</details>`, 'predict', 'Try a promotion', 'normal', 'Costs', 'Ingredients and packaging cost $2 per cup. Base staffing, rent and utilities add $250 for the day.');
    case 'predict': return frame('What do you think?', `<p class="narration">A 10% discount makes each cup ${price}. Assume 140 cups sell. Will profit beat ${wholeMoney(day.profitCents)}?</p><div class="prediction" role="group" aria-label="Your prediction"><button type="button" class="choice" data-action="predict-more" aria-pressed="${state.prediction === 'more'}">More profit</button><button type="button" class="choice" data-action="predict-less" aria-pressed="${state.prediction === 'less'}">Same or less</button></div>`, 'promotion', state.prediction ? 'See what happens' : 'Skip prediction', 'costs');
    case 'promotion': return frame('The promotion day', `${figures([['Cups sold', promo.day.cups], ['Price per cup', price], ['Revenue', wholeMoney(promo.day.revenueCents)]])}<p class="narration">More cups bring in ${wholeMoney(promo.day.revenueCents)}. They also cost ${wholeMoney(promo.day.variableCostCents)} to make.</p><p class="hint">140 cups is an assumption, not a forecast.</p>`, 'compare', 'Compare profit', 'predict');
    case 'compare': return frame('Did the promotion help?', `${figures([['Normal profit', wholeMoney(day.profitCents)], ['Promotion profit', wholeMoney(promo.day.profitCents)], ['Improvement', wholeMoney(promo.differenceCents)]])}<p class="narration">${wholeMoney(promo.day.revenueCents - day.revenueCents)} more sales revenue − ${wholeMoney(promo.day.variableCostCents - day.variableCostCents)} more cup costs = ${wholeMoney(promo.differenceCents)} more profit.</p>${state.prediction ? `<p class="hint">${state.prediction === 'more' ? 'Your prediction matched this example.' : 'In this example, the extra sales covered the added costs.'}</p>` : ''}<details><summary>Promotion breakdown</summary>${ledger(promo.day)}</details>`, 'experiment', 'Try your own scenario', 'promotion');
  }
}
function comparison(run) {
  return run.comparison === 'same' ? 'Same profit as the normal day.' : `${wholeMoney(Math.abs(run.differenceCents))} ${run.comparison === 'better' ? 'more' : 'less'} than the normal day.`;
}
function outcome(run) {
  return run.outcome === 'break-even' ? 'Break-even' : `${wholeMoney(Math.abs(run.day.profitCents))} ${run.outcome}`;
}
function experiment() {
  const draft = state.drafts[state.mode];
  const run = state.runs[state.mode];
  const dirty = state.dirty[state.mode];
  return `<div class="shell">${header('Try a promotion')}<div class="experiment-layout"><div>${scene()}<p class="experiment-picture-copy">Can you earn a profit but less than on the normal day?</p></div><section class="experiment-pane" aria-label="Promotion experiment"><h2>What changes today?</h2><p class="read-only-promo">10% discount · ${money(promotionalPrice(state.setup.priceCents))} per cup</p><form id="experiment-form"><div class="fields"><div class="field"><label for="experiment-cups">Cups sold</label><input id="experiment-cups" type="number" name="cups" min="80" max="180" step="10" required value="${escape(draft.cups)}" aria-describedby="turnout-hint"></div><p class="hint" id="turnout-hint">Assumed turnout, not a forecast.</p><div class="field"><label for="experiment-staff">Extra staffing</label><select id="experiment-staff" name="staffing">${STAFF_OPTIONS.map(cents => `<option value="${cents}" ${String(cents) === draft.staffing ? 'selected' : ''}>${wholeMoney(cents)}</option>`).join('')}</select></div></div>${costs()}<p id="experiment-error" class="error" role="alert"></p><button class="primary" type="submit">Run the day</button>${button('restore', 'Restore promotion')}</form><div class="run-result"><p id="run-status" class="${dirty ? 'stale' : ''}">${run ? dirty ? 'Inputs changed. Run the day to update the result.' : `${outcome(run)}. ${comparison(run)}` : 'Run the day to see your result.'}</p>${run && !dirty ? `<details><summary>Daily breakdown</summary>${ledger(run.day)}</details>` : ''}<button class="primary" type="button" data-action="results" ${!run || dirty ? 'disabled' : ''}>See results</button></div><div class="result-actions">${button(state.mode === 'guided' ? 'compare' : 'home', 'Back')}${state.mode === 'explore' ? button('restart', 'View lesson') : ''}</div></section></div></div>`;
}
function ending() {
  const run = state.runs[state.mode];
  if (!run || state.dirty[state.mode]) { state.screen = 'experiment'; return experiment(); }
  const monthly = monthlyEstimate(run.day);
  return `<div class="shell">${header('Your result')}<section class="ending" aria-label="Anna and her teammate outside the shop"><div class="ending-panel">${figures([['Revenue', wholeMoney(run.day.revenueCents)], ['Costs', wholeMoney(run.day.totalCostCents)], ['Profit', wholeMoney(run.day.profitCents)]])}<p class="outcome ${run.outcome === 'loss' ? 'negative' : run.outcome === 'profit' ? 'positive' : ''}">${outcome(run)}</p><p>${comparison(run)}</p><p class="hint">Normal-day profit: ${wholeMoney(run.baseline.profitCents)}.</p><details><summary>Daily breakdown</summary>${ledger(run.day)}</details><details><summary>Monthly estimate</summary><p>26 identical trading days: <strong>${wholeMoney(monthly.profitCents)} ${monthly.profitCents < 0 ? 'loss' : 'profit'}</strong>.</p>${ledger(monthly, 'Monthly estimate — 26 identical trading days')}</details><div class="result-actions">${button('experiment', 'Try again', true)}${button('home', 'Back to welcome')}</div></div></section></div>`;
}
function render(focus = true) {
  document.querySelector('#result-announcement').textContent = '';
  document.body.dataset.screen = state.screen;
  app.innerHTML = state.screen === 'welcome' ? welcome() : state.screen === 'experiment' ? experiment() : state.screen === 'results' ? ending() : guidedScreen();
  for (const img of app.querySelectorAll('.scene img')) {
    const fail = () => img.closest('.scene').classList.add('failed');
    img.addEventListener('error', fail);
    if (img.complete && !img.naturalWidth) fail();
  }
  const title = app.querySelector('#main-heading');
  document.title = `Anna’s Tea — ${title?.innerText.replace(/\n/g, ' ') || 'Learn what changes profit'}`;
  if (focus) { title?.focus({ preventScroll: true }); window.scrollTo(0, 0); }
}
app.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (action === 'detail') {
    const expanded = target.getAttribute('aria-expanded') !== 'true';
    target.setAttribute('aria-expanded', String(expanded));
    document.querySelector('#scene-detail').hidden = !expanded;
    return;
  }
  if (action === 'guided' || action === 'explore') { state.mode = action; render(false); app.querySelector(`[data-action="${action}"]`).focus(); return; }
  if (action.startsWith('predict-')) { state.prediction = action === 'predict-more' ? 'more' : 'less'; render(false); app.querySelector(`[data-action="${action}"]`).focus(); return; }
  if (action === 'restart') {
    state.mode = 'guided'; state.setup = GUIDED; state.screen = 'normal'; state.prediction = null;
    state.drafts.guided = freshDraft(); state.runs.guided = null; state.dirty.guided = true;
  } else if (action === 'restore') {
    state.drafts[state.mode] = freshDraft(); state.dirty[state.mode] = true; render(false); app.querySelector('#experiment-cups').focus(); return;
  } else if (action === 'home') state.screen = 'welcome';
  else if (['normal', 'costs', 'predict', 'promotion', 'compare', 'experiment', 'results'].includes(action)) {
    if (action === 'results' && (!state.runs[state.mode] || state.dirty[state.mode])) return;
    state.screen = action;
  }
  render();
});
app.addEventListener('input', event => {
  if (event.target.closest('#setup-form') && state.mode === 'explore') {
    const form = new FormData(app.querySelector('#setup-form'));
    state.setupDraft = { cups: form.get('cups'), price: form.get('price') };
  }
  if (event.target.closest('#experiment-form')) {
    const form = new FormData(app.querySelector('#experiment-form'));
    state.drafts[state.mode] = { cups: form.get('cups'), staffing: form.get('staffing') };
    state.dirty[state.mode] = true;
    document.querySelector('#result-announcement').textContent = '';
    const status = app.querySelector('#run-status');
    status.textContent = state.runs[state.mode] ? 'Inputs changed. Run the day to update the result.' : 'Run the day to see your result.';
    status.className = 'stale';
    app.querySelector('[data-action="results"]').disabled = true;
    app.querySelector('.run-result details')?.remove();
  }
});
app.addEventListener('submit', event => {
  event.preventDefault();
  if (!event.target.reportValidity()) return;
  try {
    if (event.target.id === 'setup-form') {
      state.setup = state.mode === 'guided' ? GUIDED : validateSetup({ cups: Number(state.setupDraft.cups), priceCents: moneyToCents(state.setupDraft.price) });
      state.prediction = null;
      state.runs[state.mode] = null; state.dirty[state.mode] = true;
      if (state.mode === 'guided') state.drafts.guided = freshDraft();
      state.screen = state.mode === 'guided' ? 'normal' : 'experiment';
      render();
    } else if (event.target.id === 'experiment-form') {
      const draft = state.drafts[state.mode];
      const inputs = validateExperiment({ cups: Number(draft.cups), extraStaffCents: Number(draft.staffing) });
      state.runs[state.mode] = runPromotion(state.setup, inputs, PROMOTION);
      state.dirty[state.mode] = false;
      render(false);
      document.querySelector('#result-announcement').textContent = `${outcome(state.runs[state.mode])}. ${comparison(state.runs[state.mode])}`;
      app.querySelector('[data-action="results"]').focus();
    }
  } catch (error) {
    app.querySelector(event.target.id === 'setup-form' ? '#setup-error' : '#experiment-error').textContent = error.message;
  }
});
render(false);
