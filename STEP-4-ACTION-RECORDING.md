# Step 4 — Action Recording

Part B was signed off by the user on 4 November 2026. Its implementation is
commit `018ee1e` on v5. Part A remains pending mobile testing. Pitch dimensions
and visuals are being developed in a separate chat and are outside this work.

The user confirmed a behavior-preserving audit/refactor of existing action
recording. No new recording controls, categories, pitch behavior or age-selection
feature are included.

## Current paths

- Coach action buttons and Player grid both enter `beginV2` in the new
  `action-recording.js` module, loaded before `v02.js`.
- Player Pass uses `v2GridHold` for tap/1.5-second/3-second quality, with event
  time captured on pointer down. Legacy `activeHold` in `touch.js` is separate.
- Goals and assists, and opposition shots and keeper saves, share one parent
  event. `finishV2` commits it, and Undo removes it atomically.
- `team-selection.js` wraps player selection to offer a substitution for a
  bench player, then resumes the original capture with its timestamp/quality.
- Set pieces have a separate draft/result lifecycle in `set-pieces.js` and reuse
  location controls. Their stored restart can later gain a linked result.

## First fixes

A new regression reproduced an extra Pass saved when releasing a hold after
navigating from Match Centre to Report. Unfinished V2 captures also remained
available to stale save callbacks after navigation.

`recordingContextValid` now centralizes the validity check: same match, live view,
started clock and match not ended. Before rendering, stale holds and captures
are cancelled. Hold start/release and event commit use the same condition.
Pausing a started match remains valid; the first-tap timestamp survives.

Set-piece and substitution commits now use that same context check. Already-saved
set-piece restarts are preserved when their unfinished result is cancelled.
Undo and edit-action mode cancel both legacy and current holds, preventing a
release from saving a new Pass after the user has chosen Undo.

Capture state, entry/commit/cancellation and Pass-hold functions now have one
owner in `action-recording.js`. Rendering and category-specific choices remain
in `v02.js`; the redundant `setInputMode` wrapper was removed and its hold
cancellation moved to the existing mode setter. Legacy recording adapters remain
in place for compatibility; this change does not attempt wholesale deletion.

All 18 regression scripts and 12 baseline Match Centre markup comparisons pass.
New regressions cover navigation, held Pass, match switching, reset/full-time,
unchanged first-tap timestamps and atomic linked assist/undo. Existing suites
cover both input modes, quality holds, defence, special actions, bench-action
continuations, opposition saves, set pieces, persistence and reports.

`action-recording-parity-tests.cjs` compares 32 complete saved event/score results
against accepted Part B commit `018ee1e`: both modes, goals, assists, opposition
goals and keeper saves, every shot outcome, defence subtype, Special category,
and all three Pass qualities. IDs and clock are deterministic. All match.

Interactive localhost smoke check passed: open Coach goal dialog, cancel it,
switch to Player mode, tap Pass (key-action count 7 → 8), Undo (8 → 7). This
used the isolated fictional demo and did not modify the saved real draft.

## Status

Implementation is on v5 and reflected in the localhost preview. No hosted-site
publication or main merge/deployment is included. Main is unchanged.
The separate chat's untracked pitch assets, generator and docs were untouched.

Step 4 is not yet signed off. Interactive acceptance of capture/cancellation is
still needed, especially pointer cancellation and quality holds on mobile.
Mobile pointer cancellation and 1.5/3-second quality holds remain acceptance
checks; desktop smoke and automated tests do not replace them. Part A's pitch
rotation/mobile sign-off is separate and remains pending.
