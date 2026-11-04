# Part B: Match Centre refactor (v5)

Baseline: `fe3dc2e83c4e8becf461100c3a9aee119827e5f1`.

## Changes

- `clock.js` owns clock transitions, the pre-match start guard, reset cleanup
  (mode, award, keeper, report review), and full-time modal cleanup. Removed
  layered `selectClock` overrides from Coach, awards, team selection, pre-match
  and post-match modules. The hold-entry pre-match guard remains intentional:
  it blocks feedback before the hold starts; the transition guard checks again
  when a hold completes.
- Removed discarded legacy clock and Coach render wrappers. The current
  Coach action panel and Player grid in `v02.js` remain the input surfaces.
  Screen metadata no longer rewrites clock/score markup.
- Live scoreboard and report share `scorePanelHTML`; timer and score status
  share `matchStatus`. Existing labels and styles remain unchanged. During
  script initialization the timer remains available before the score module loads.
- Mode changes cancel holds and unfinished V2 capture dialogs, retaining all
  recorded events and clock state. Navigation cancels stale clock holds.
- Updated cache versions for changed browser scripts. No CSS changes.

## Validation

All **16** `*tests.cjs` scripts pass under Node, including the new
`match-centre-tests.cjs`. These run the production script order against a
lightweight DOM stub; they do not constitute interactive browser testing.

New checks cover one timer, scoreboard and mode bar; unchanged match records
across modes; capture cancellation; deterministic pause/resume timing;
halftime, second half, full-time and reopening; cross-match hold cancellation;
reset cleanup and saved-data recovery. Existing pre-match, substitutions,
set-piece, score, pitch rotation, reports and highlights suites also pass.

`node verify-part-b-ui.cjs` passes **12** comparisons against baseline final
Match Centre HTML: both input modes across ready, paused, running, half-time,
second-half and full-time states. Live clock text is excluded from this markup
comparison. `git diff --check` passes. This is markup parity, not pixel parity.

Re-run the suite in PowerShell:

```powershell
Get-ChildItem -Filter '*tests.cjs' | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Failed: $($_.Name)" }
}
node verify-part-b-ui.cjs
```

## Remaining verification and decision

No interactive browser or physical mobile testing was performed in this task.
On an isolated v5 test environment, verify first/later-game team confirmation,
1.5-second holds and cancellation, pause/resume, halves, reopening/reset,
Coach/Player capture and mode switching, substitutions, and report navigation.
Check focus, touch targets, scrolling and hold feedback on iPhone Safari.

**Part A remains pending mobile tests:** four pitch rotations throughout goal,
assist and set-piece capture; tap accuracy; and opposition positions in exported
highlights. No pitch-coordinate implementation was changed here.

All work is for `v5` only. No merge, deployment or workflow dispatch is part of
this task. The Pages push workflow targets `main`; it was left unchanged.

User decision: accept this implementation for v5 browser/mobile acceptance
testing, or request adjustments. Neither decision authorizes a main merge or
deployment. Part B final sign-off follows interactive acceptance testing.
