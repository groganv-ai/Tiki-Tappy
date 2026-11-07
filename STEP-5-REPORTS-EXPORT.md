# Step 5 — Reports, highlights and export

## Scope and status

The user authorized moving forward on 6 November 2026 and deferred mobile acceptance until the end. Part B remains accepted. Part A rotation/mobile checks and Step 4 mobile touch/hold acceptance remain pending; this work does not sign them off. Changes stay on v5, with no main merge or deployment.

This stage preserves report formats, content filters, linked events, award reasons, filenames and explicit Share/Save gestures. Baseline: `c56a4ea3d6de6095306244dc6c6547bb59ac331b`.

## Ownership changes

- `report-output.js` owns current matchday image export and the single `makeDayReportPages` dispatcher. It chooses compact action/timeline reports or Player Summary from a deep matchday snapshot with saved flow and player scope.
- Removed superseded exporters in `match-report.js` and `post-match.js`, the unused per-game matchday pagination fallback, and report-page dispatch overrides in `compact-reports.js` and `player-summary.js`. The renderers themselves retain their existing pagination and layout code.
- `disposeExport` owns cleanup of report URLs/files as well as prepared media and replay. It invalidates pending image requests. The report-specific close wrapper is no longer needed; the existing recording guard remains in `closeExport`.
- `highlights.js` owns `makeReplayModel(match, day)`, incorporating the previous base/timeline/club-profile wrappers. `makeDayReplayModel` passes each match explicitly and no longer mutates global `mi`.
- Existing video encoding, sharing fallbacks, legacy event compatibility and drawing wrappers remain. This stage does not rewrite historical data or broadly remove the remaining report UI wrapper chain.

## Export lifecycle fixes

Previously, shared report files/URLs were appended page by page, and the matchday identity was checked only before encoding began. Closing an export, changing content or changing matchdays during a later callback could publish stale or partial output.

Each request now retains one content snapshot and identity. Pages encode privately; only a complete current request publishes files and opens its preview. Closing/disposal invalidates the request, and a late old callback cannot clear a newer request's busy state or overwrite its files. Canvases are released in `finally`, and report URLs are released on disposal or failure. Starting an image export cannot interrupt an active recording.

## Verification

All 26 regression suites pass. New lifecycle coverage includes cancellation during rendering and encoding, a new request overtaking an old encoder, partial-page failure, changed filters/notes/matchday/view, recording guards, canvas release and URL cleanup.

`report-output-parity-tests.cjs` compares against the committed baseline: 25 model/playback-plan comparisons and 15 exact report canvas text/position/page-metadata comparisons across five filters and all three report views, with three matches and an award reason. The selected match remains unchanged. Existing suites retain 321-event pagination, linked contributions, scoring and recording parity coverage.

## Deferred acceptance and continuation

Real-phone touch/holds and pitch rotations remain pending, as do visual report/award review and a complete encoded-video/share round trip. No physical-device or encoded-video verification is claimed for this stage. The existing private test Site is refreshed for later acceptance.

Next refactor candidate: inspect the remaining report screen/render wrappers and media encoder cancellation/resource ownership. Preserve current UI and require evidence before removing compatibility paths. This is a continuation candidate, not an additional signed-off migration stage.
