# Application pages

This browser application uses in-memory screen state rather than server routes. Refreshing returns to welcome. All figures and explanations are HTML; illustrations are static assets.

| Screen | Purpose | Next action |
| --- | --- | --- |
| Welcome | Select Guided lesson or Explore; Explore edits the normal-day cups and price | Start lesson / Explore shop |
| A normal day | Connect cups and price to revenue | See costs |
| Costs | Explain cup costs, operating costs and the profit left over | Try a promotion |
| Prediction | Make an optional prediction about the supplied promotion | See what happens / Skip prediction |
| Promotion | See the discounted price, assumed turnout and additional cup costs | Compare profit |
| Comparison | Explain the change in profit with the change in revenue and costs | Try your own scenario |
| Experiment | Change cups and extra staffing, then run the day | See results |
| Results | Show completed daily figures and an optional monthly estimate | Try again / Back to welcome |

## Model and state

- Guided uses 100 cups at $5. The promotion assumes 140 cups at a 10% discount.
- Explore setup freezes a custom baseline for its run. Its discounted price derives from that baseline.
- Editing experiment inputs makes the completed result stale. Run again before viewing results.
- Restore promotion resets cups/staffing; it does not replace the baseline. Returning to setup and starting again creates a new baseline.
- Guided and Explore keep separate experiment drafts during the session. Restart lesson restores Guided presets.
- Monthly estimates multiply every included revenue and cost line by 26 identical trading days.

## Extension points

`src/model.js` owns the financial rules. The current UI selects one 10% lesson scenario; the percentage calculation already accepts other whole-number percentages. Additional promotion kinds belong at the promotional-price boundary, with their own tested accounting rules and explanatory copy. Do not infer demand from discount size. The illustration does not drive the calculation.

## Accessibility

Use keyboard-operable mode buttons, labeled native fields and disclosures, visible focus and semantic tables. Screen headings receive focus after navigation. Only completed results are announced. Respect reduced motion; no animation or audio is required. Image failures retain the text lesson and figures. At narrow widths, content stacks and the page scrolls.
