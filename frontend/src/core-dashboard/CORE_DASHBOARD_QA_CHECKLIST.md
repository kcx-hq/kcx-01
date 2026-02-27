# Core Dashboard QA Checklist

## Global
- Load `/dashboard` on hard refresh and verify full-screen loader appears.
- Verify app lands on `Overview` after hard refresh from any `/dashboard/*` route.
- Verify sidebar + header appear only after dashboard boot completes.
- Verify light green theme (no legacy accent fallback styles).

## Filters and URL State
- Apply `provider/service/region` filters and confirm URL query params update.
- Refresh page and confirm filters restore from URL.
- Use browser back/forward and confirm filters sync with UI.

## Section Loaders
- Overview: initial load shows `Analyzing Overview...`.
- Data Explorer: initial load shows `Analyzing Data Explorer...`.
- Cost Analysis: initial load shows `Analyzing Cost Analysis...`.
- Cost Drivers: initial load shows `Analyzing Cost Drivers...`.
- Resources: initial load shows `Analyzing Resources...`.
- Data Quality: initial load shows `Analyzing Data Quality...`.
- Accounts & Ownership: initial load shows `Analyzing Accounts & Ownership...`.
- Optimization: initial load shows `Analyzing Optimization...`.
- Reports: initial load shows `Analyzing Reports...`.

## Local Refresh UX
- Overview cards/charts show localized refresh overlays only (not full section reload).
- Optimization tabs show localized refresh overlays only.
- Cost Drivers lower analytics area shows localized updating overlay on period change.

## Module Resilience
- Simulate one module runtime error and confirm only that module fails (error boundary card).
- Confirm other modules remain navigable and working.

## Vertical Sidebar
- Verify premium users see normal upload card (`New Upload`, `Unlimited uploads`).
- Verify non-premium behavior remains restricted where intended.
- Verify sidebar scrollbar is slim and theme-aligned.
- Verify nav items are keyboard-focusable and have labels/tooltips.

## Data Quality
- Verify table/header scrollbars are slim and theme-aligned.
- Verify `Broken Metadata` count matches tab count (no mismatch with `Zero Cost`).
- Verify Issue Inspector opens below top navbar and stays visible.

## Cost Analysis
- Verify breakdown color mapping matches chart colors.
- Verify toggling services does not reassign top-series color unexpectedly.
- Verify sparse/low-share services still remain visible on area chart.

## Accounts & Ownership
- Verify section uses initial loader only.
- Verify no row-level loading overlay after data loads.
- Verify section wrapper style matches other modules.

## Reports
- Verify report loading state matches section standard loader.
- Verify report download still works and button states are correct.

## Responsive
- Validate all modules at 360px, 768px, 1024px, 1280px, 1440px.
- Verify side panels/drawers do not hide behind navbar.
