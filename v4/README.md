# TikiTapper v4 — isolated development prototype

This is the first **foundation milestone**, not a feature-complete replacement for TikiTapper.

- Open `v4/index.html` through a static HTTP server with JavaScript modules enabled.
- Uses localStorage key `tikitapper-v4` and never reads the older `tikitapper-v1` key.
- Coach and Player use the same action registry, event factory and event store.
- Coach Shot / Pass / Tackle use four independently tappable zones (Basic, ★, ★★, ★★★).
- Goal and Shot currently use a **temporary three-region pitch picker**, not the approved detailed pitch.
- Goal assists, automatic saves, set pieces, substitutions, team setup, clock halves, reports, highlights, and final visual parity are **not implemented** in this milestone.
- The legacy root `index.html` and other branches are not modified.

## Next milestone
Add complete shared capture stages, canonical pitch input, lineup and match clock semantics, then run regression tests before replacing any existing UI.


## Milestone 2 (in progress)
- Shared capture controller now supports Goal scorer and optional assister with separate locations, Shot outcomes, and opposition saved shots with a linked goalkeeper selection.
- A lined pitch with precise pointer entry and keyboard-accessible nine-zone fallback replaces the temporary three-region picker.
- Coach and Player modes call the same capture controller.
- Formation-style player selection and list fallback are available; team setup is still rudimentary, and roles/eligibility need a full substitution system.
- Core unit-test source is in `tests/core.test.mjs` (run with `node --test v4/tests/core.test.mjs` from repository root).
- **Not yet browser-tested or CI-tested.** These are source changes only; no claim of passing tests.
- The goal-assist and shot-save links are stored within their parent event, rather than creating separate event rows; reporting must expand these links later.
- Full match clock, set-piece flows, automatic keeper selection from formation, and match/report parity are not complete.
