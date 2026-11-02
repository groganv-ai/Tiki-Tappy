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
