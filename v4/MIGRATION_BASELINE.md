# TikiTapper v3 → v4 migration baseline
Status: source audit in progress. No production modifications.

## Decision
Treat v4 as an **incremental migration** of the production v3 UI/UX, not a new front-end design. Production `main` is read-only until explicit release approval. The separate v4 prototype is an engine sandbox, **not** the target interface.

## Source inventory (production `main`, inspected 2026-11-03)
- `index.html`: original shell, home/setup/live/report navigation, base data model and inline functions.
- `free-matchday.js`: single draft, explicit replacement/clear, demo isolation and recovery.
- `clock.js`: 1.5s hold controls, pause/resume, halftime/fulltime/reset and reopening a finished match.
- `coach-mode.js`, `v02.js`, `pitch.js`, `set-pieces.js`: coach/player capture, quality, pitch and integrated set-piece flows.
- `team-selection.js`, `pre-match.js`, `match-settings.js`: lineup, substitutes, pre-match settings and fixtures.
- `post-match.js`: resumable review → award → content → output flow; match confirmation and editing.
- `match-report.js`, `compact-reports.js`, `player-summary.js`, `highlights.js`, `v02-highlights.js`: timelines, grouped statistics, exports and replay.
- `home-moments.js`, `action-icons.js`, `game-icons.js`, `score-layout.js`, `mobile.css`, assets: visual fidelity requirements.
- Numerous existing `*-tests.cjs`: migration regression evidence, must inventory and run.

## Architecture risks identified
1. **Global render monkey-patching:** `clock.js`, `free-matchday.js`, `post-match.js`, `v02.js` and other files wrap/replace `render`, `renderReport` or actions at script load. Preserve resulting DOM/behaviour, migrate to explicit controllers and view composition; avoid duplicating legacy renderers.
2. **Storage incompatibility:** v3 `localStorage['tikitapper-v1']` uses `data.days`, `data.selected`, named players and events with `action`, `at`, `opp`. v4 `tikitapper-v4` uses IDs, `matchday.matches`, typed `type`, `team`, `matchTime`. Never overwrite v3 data. Build an import/normalisation adapter with fixture, event and report fidelity tests before switching.
3. **Clock lifecycle mismatch:** v3 supports reopening finished matches, reset, and clock-start semantics; v4 currently treats Full Time as terminal and lacks reopen/reset. Do not replace clock UI until these semantics are reconciled and tested.
4. **Matchday end-flow mismatch:** v3 has review confirmation, Player of the Day, content selection, output and resume. v4 currently has a simple Full Time options screen and report download. Preserve v3 end flow; v4 builder should provide data, not dictate navigation.
5. **Demo safety:** v3 demo preserves/restores the real draft and uses randomised fictional players. v4 has no equivalent demo-isolation architecture yet.
6. **Capture parity:** v3 has special cases for set-piece capture, save quality, opponent actions, pitch, and quality labels. v4 action registry is a partial model; do not remove legacy code until per-action parity fixtures pass.
7. **Player Summary export:** v3 `makePlayerSummaryPages` creates horizontal category bands of 7. New agreed behaviour: ALL 12 action icons + player identity + total fit within one portrait page width, with pagination by player rows only. Explicit approved change.
8. **Substitutions:** v3 supports bench selection and match-specific lineups; v4 event and lineup undo logic requires scenario verification before migration.

## Migration contract
For every stage:
- Preserve v3 HTML/CSS/assets and exact navigation and touch interactions, except explicitly approved changes.
- Characterise current behaviour using source-driven tests and representative matchday fixtures before swapping implementation.
- Introduce v4 service behind an adapter; compare old/new event, clock, matchday and report outcomes.
- Migrate one dependency at a time; remove its legacy logic only after parity tests pass.
- Keep real and demo data isolated, keep existing local draft recoverable, and provide rollback.
- Verify in browser on mobile and desktop before calling a stage complete.

## Proposed sequence
0. Freeze v3 source baseline; inventory scripts, styles, assets, tests and user journeys. **Current stage**.
1. Build a v3-compatible preview branch with unmodified v3 UI and independent storage namespace; never point it at production data.
2. Add v3↔v4 adapter with round-trip fixtures and regression tests; migrate clock first only after reopening/reset semantics agreed.
3. Migrate squad/fixtures, event capture, reports and demo behind original screens, one stage at a time.
4. Integrate approved new quality tap areas and 12-icon portrait summary after parity established.
5. Full end-to-end mobile regression; release approval required before production changes.

## Acceptance scenarios to automate
- Start a matchday, add fixtures, select formation and bench, pause/resume, halftime, added time, substitutions, Full Time and reopen.
- Record each of 12 action categories, linked assists/saves, both-team set pieces, pitch points and quality levels.
- Undo/edit while preserving substitution lineup history and linked event counts.
- End all fixtures → review → Player of the Day → report preset → export; leave and resume.
- Enter demo, perform actions, exit, and confirm real matchday unchanged.
- Refresh/reload at each screen and recover saved draft.
- Player Summary: 12 icon columns fit portrait; no player row splits across pages.

## Important constraints
- The v4 engine sandbox may continue to host unit tests but must not become a substitute UI design.
- Do not claim parity or test pass without executing relevant tests.
- Avoid triggering known noisy GitHub Actions workflows until test configuration is understood.
