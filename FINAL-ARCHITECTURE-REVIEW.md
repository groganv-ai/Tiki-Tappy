# Final architecture review — v5

## Verdict and scope

Reviewed baseline `5211f27f034f800ec232184fc47d4196ec9104c0` on v5, covering bootstrap/script order, clock and mode ownership, capture and linked events, pitch geometry, temporary persistence/demo isolation, report models/rendering, export snapshots, media cancellation and object-URL/canvas/track cleanup. This is a targeted architecture and regression review, not a penetration test or physical-device acceptance.

The core behaviour consolidation is in place. No additional critical/high-severity issue was established in the inspected flows. Two concrete issues were reproduced or detected and fixed below. The app still uses ordered classic scripts, shared globals and render decorators: the refactor is not a complete migration to isolated modules. Retaining that debt is explicit, rather than describing every remaining wrapper as obsolete.

## Findings

| ID | Priority | Finding | Disposition |
|---|---|---|---|
| AR-01 | Medium | Player Summary sort was absent from the export snapshot/key. A changed sort during encoding could publish an image with the old order, and rendering a saved snapshot could use the current global sort. | Fixed: snapshot includes sort; page generation and export metadata use it; changing sort invalidates an outstanding export. Regression failed before the fix and passes after it. |
| AR-02 | Low | `updates.js` retained a shadowed `startReplay` declaration. The media module won by load order, so runtime behaviour used the safe session loop, but there were still two apparent owners. | Fixed: removed the obsolete declaration. An architecture regression now checks ten consolidated functions have one declaration/implementation owner. |
| AR-03 | Medium, maintenance | Shared mutable state (`data`, `view`, `mi`, capture drafts, export state) and ordered render decorators remain. Some old live-screen rendering runs before V2 replaces it. | Retained debt. Domain functions are consolidated, but replacing the remaining screen composition/bootstrap requires a separate scoped migration with markup and interaction parity. No broad deletion is justified by function-name duplication alone. |
| AR-04 | Acceptance gap | Recorder tests simulate browser APIs; physical mobile rotation, pointer holds/cancellation, report readability and real encoding/sharing are unverified. | Deferred by the user until final testing. Remains an acceptance condition, not an automated pass or sign-off. |
| AR-05 | Low, documentation | README described obsolete duration selection, backup import and matchday finishing semantics. | Corrected to current presets, report creation/draft deletion distinction, private v5 test hosting and disabled legacy import. |

## Current ownership

| Area | Active owner(s) | Boundary/retained compatibility |
|---|---|---|
| Bootstrap and persistence | `index.html`, `free-matchday.js` | Classic script load order remains. One temporary real draft; demo uses separate in-memory data and does not save over it. Earlier local records remain exportable. |
| Timing and modes | `timing.js`, `clock.js`, `coach-mode.js` | Half-aware immutable event metadata; explicit clock actions; view metadata decorators remain. |
| Capture | `action-recording.js`, `v02.js` | Shared Coach/Player lifecycle; V2 owns capture UI. `team-selection.js` and `set-pieces.js` add substitution/restart workflows with the same context validation. Legacy grid helpers remain for compatibility. |
| Pitch | `pitch-selector.js`, generated `pitch-template-data.js` | Age/format configured in setup; geometry snapshots identify template space. Legacy points remain interpreted without rewriting saved events. |
| Matchday report UI | `post-match.js`, `compact-reports.js`, `player-summary.js` | Matchday owns flow; compact renderer owns action/timeline; Player Summary dispatches the player view. Photo export reminder is an intentional active decorator. |
| Image output | `report-output.js` | One page dispatcher/export owner; immutable content/scope/sort snapshot; stale requests cannot publish; complete files publish atomically. Legacy single-match drawing helpers remain for compatibility/regression coverage. |
| Highlights | `highlights.js`, `v02-highlights.js`, `post-match.js` | Explicit per-match model, quality filters and composed matchday plans; no temporary global match switching. Drawing/plan extension layers remain intentional. |
| Media | `media-recording.js`; shared export/share helpers in `updates.js` | Session identity, recorder/RAF/timer/track lifetime and cancellation; explicit gesture-driven sharing with browser fallback. |

## Verification

All 29 test suites pass. The new architecture suite checks loaded modules exist, are unique, respect critical dependency order and have one owner for ten consolidated functions. Export tests now cover snapshot sort and sort changes during encoding.

Existing evidence retained: 32 action-recording event/score parity cases, 3,130 pitch-coordinate assertions, 25 report/replay model/plan comparisons, 15 canvas text/position/page-metadata comparisons across five filters and three views, and 27 exact report/prepared-file markup comparisons. Recorder coverage includes stale callbacks, duplicate starts, cancel, error, empty output, watchdog, detached canvas/navigation and resource cleanup. See the individual scripts for precise fixture limits.

No new physical-phone, native browser encoder or share-target test was performed for this review. No main merge or main deployment is included. The private preview receives the two scoped fixes; access is preserved.

## Remaining work and decision

Part B is accepted. Part A mobile pitch rotation and Step 4/Step 5 physical acceptance remain pending at the user's request. Functional consolidation can proceed to the final manual acceptance pass after these review fixes. A complete module/bootstrap migration is not required to claim the present behaviour-preserving consolidation, but must not be represented as already finished.

If a fully isolated architecture is desired, define a follow-on scope for screen composition and state ownership before removing the remaining render chain. Otherwise, finish the deferred phone checklist, fix any findings and explicitly accept Part A/Step 4/Step 5. Production/main publication remains a separate decision.
