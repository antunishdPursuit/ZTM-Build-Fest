# Application pages

This browser application uses in-memory screen state rather than server routes. Refreshing returns to welcome. All figures and explanations are HTML; illustrations are static assets.

| Screen | Purpose | Next action |
| --- | --- | --- |
| Welcome | Explain the business-analytics lesson in the hero; list learning outcomes and choose Guided/Explore in a separate setup section | Choose how to learn, then Start lesson / Explore shop |
| A normal day | Connect cups and price to revenue with a worked example and optional understanding check | Back / Continue |
| Costs | Explain cup costs, operating costs and profit with a worked subtraction and optional check | Back / Continue |
| Prediction | Make an optional prediction about the supplied promotion; Continue also skips the prediction | Back / Continue |
| Promotion | See the discounted price, assumed turnout and additional cup costs | Back / Continue |
| Comparison | Explain the change in profit with the change in revenue and costs | Back / Continue |
| Experiment | Change cups and extra staffing, then run the day | See results |
| Results | Show completed daily figures and an optional monthly estimate | Try again / Back to welcome |

## Model and state

- Guided uses 100 cups at $5. The promotion assumes 140 cups at a 10% discount.
- Explore setup freezes a custom baseline for its run. Its discounted price derives from that baseline.
- Editing experiment inputs makes the completed result stale. Run again before viewing results.
- Restore promotion resets cups/staffing; it does not replace the baseline. Returning to setup and starting again creates a new baseline.
- Guided and Explore keep separate experiment drafts during the session. Restart lesson restores Guided presets.
- Monthly estimates multiply every included revenue and cost line by 26 identical trading days.
- Understanding-check answers are session-only and persist when moving back/forward. Starting or restarting the lesson clears them. No score is recorded and Continue is never gated by an answer.
- The shared lesson frame uses Sales / Costs / Promotion / Your turn indicators, the same brand/topic type size, a shop illustration, a teaching question, worked calculation and explanation. Stage indicators do not skip steps.

## Extension points

`src/model.js` owns the financial rules. The current UI selects one 10% lesson scenario; the percentage calculation already accepts other whole-number percentages. Additional promotion kinds belong at the promotional-price boundary, with their own tested accounting rules and explanatory copy. Do not infer demand from discount size. The illustration does not drive the calculation.

## Accessibility

Use keyboard-operable mode/answer buttons, labeled native fields and disclosures, visible focus and semantic tables. Screen headings receive focus after navigation; answering keeps focus on the selected answer and announces its explanation through the persistent status region. Completed financial results are announced there too. Respect reduced motion; no animation or audio is required. Image failures retain the text lesson and figures. At narrow widths, scene, teaching content and navigation stack in reading order.
