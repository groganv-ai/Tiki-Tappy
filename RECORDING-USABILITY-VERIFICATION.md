# Recording and report corrections — v5

Baseline: `ad79110`. Completed 5 November 2026 following local testing feedback.

## Changes

- One shared formation picker for Coach/Player scorer, assist, alternative keeper
  and set-piece player selection. The former grouped player-list branch is gone.
  Older records without assigned positions still offer their players within the
  formation surface, labelled as positions not set, without inventing roles.
- Shot, goal and assist locations use one tap. A framed action icon appears at
  the tapped location for 350 ms, then the capture advances automatically.
  There is no extra Confirm button. Arrow-key users press Enter to select.
  Cancellation, navigation and match changes invalidate pending callbacks.
- The nominated keeper action is a full-width primary button showing only the
  player's name, with a short instruction above it. Its accessible name still
  explains that it records a save.
- Player mode starts with full names. The optional names/initials toggle remains.
- Opposition display labels use the actual opponent team name, including the
  Player grid, shot heading, action summaries, timeline, feedback and highlights.
  Saved Opposition sentinel values are unchanged for backward compatibility.
- Match/report timelines use two team columns with a centred time/icon axis.
  Opponent entries and opponent action-summary text align right, in both HTML
  and exported reports. This follows the user's explicit alignment choice.
- Player Summary exports use all action columns together. They no longer split
  into seven-column bands that repeated each player on multiple image pages.
  Compact leaders retain ties, icons and highlights. A tie involving the entire
  roster is labelled All players; their individual counts remain in the table.
  A truly long roster paginates vertically, keeping each complete player row
  on one page. No generated commentary was added.
- Template-based goal replays now share the selectors' green/red palette,
  stripes, direction arrow and in-pitch labels, as well as their existing exact
  box geometry. Canonical orientation and automatic half-pitch framing remain.
  Historical untagged locations keep their legacy geometry rather than being
  silently projected onto the U14+ schematic boxes.

## Agreed report format consulted

Read the earlier **Create match report** chat
(`6ad8bc86-4d04-83eb-9b7a-6e77caab1041`). The requested format was names and
action counts, a compact leaders section, equally represented ties, action
icons, highlighted leaders/totals, and no written/automated analysis.

## Verification

- All 21 `*tests.cjs` scripts pass, including the new usability regression suite.
- Existing 32 saved-event/score comparisons and 3,130 coordinate assertions pass.
- 12 Match Centre structural comparisons pass with the requested full-name and
  opponent-label changes normalized explicitly; clock text is also excluded.
- New tests verify formation assists/scorers, name-only keeper markup, timed
  Goal/Shot/Assist icons, automatic advancement and cancellation, escaped team
  names, central timeline structure, one-page 12-category/10-player export,
  and 60 complete player rows paginating without repetition or footer overflow.
- Local browser demo: full-name Player grid; goal tap shows its framed icon and
  advances to assist; formation assist picker excludes the scorer; assist tap
  shows its icon and records the linked goal; opposition Shot shows its icon
  and opens the clear full-width keeper action. The real saved draft was untouched.
- Local browser generated the demo Player Summary as one image page. Visually
  checked leaders, counts, highlights and every player row. The two-column
  timeline and a precise goal replay were also checked visually. The replay
  showed the approved template styling and its linked assist/shot positions.

Remaining acceptance: real-device mobile touch/readability and a complete
encoded-video/share round trip. Part A mobile sign-off and Step 4 acceptance
remain separate. No merge, hosted test-site publication or main deployment is
included. The localhost preview contains these changes.

## Homepage follow-up

Mobile feedback exposed the homepage showcase still expecting the former flat
report-timeline markup. Its player/action label landed in a 30px time column
after the report changed to a two-team layout. The showcase now has its own
time/icon/text grid while retaining the shared icons, animation and pause control.
`home-moments-tests.cjs` checks all five examples without invoking the report
renderer. All 22 regression scripts pass for this follow-up. The existing private
test site is updated for phone testing; GitHub main remains unchanged.

## Saved matchday missing pitch settings

Older saved matchdays may have no pitch template. The location sheet now offers a direct Edit Matchday setup action instead of leaving the user at explanatory text. It cancels only the unfinished capture, preserves recorded events and opens the existing age/format form. Pitch selection remains in Matchday setup; no pitch dimensions are guessed. The legacy setup-save regression verifies configuration without rewriting existing events, and the new recovery regression verifies navigation and capture cleanup. All 22 test suites passed. Real-phone recovery remains to be checked.

## Single-match demo

The isolated fictional demo now includes one game, retaining its sample events. Confirming that game's full time allows result review, Player of the Day, report output and populated highlights without finishing two empty games. Real matchday creation still supports multiple opponents. The regression suite checks this single-game path; multi-game report and capture tests use explicit fixtures. All 22 suites passed. Phone export/share verification remains pending.

## U14 half-time demo scenario

The single demo game now has the configured U14 11v11 template and eleven mixed fictional names assigned GK / 4 DF / 4 MD / 2 AT. It opens paused at half time (35:00 of a 70-minute game), ready for the existing Start second half control. First-half events give Meadow United a 2–1 lead: two goals (one assisted), an opposition goal, two opposition shots saved by the nominated goalkeeper, one saved team shot, a level-two Brilliant pass and a Skill. Location-bearing events retain template geometry for consistent highlights. New demo-scenario regression checks roles, pitch markup, scores, event linkage and the transition to second-half time without changing first-half events. Existing legacy tests use the original legacy fixture where needed. All 23 suites passed. Real-phone rendering and encoded video/share remain pending user verification.

## Player of the Day reason and celebration

The matchday award step now offers an optional 160-character reason, saved in the local draft with the selected recipient. A different recipient or removing the award clears the old reason. The reason is escaped in report HTML, included in report export award blocks and the text log, and wrapped beneath the recipient in the matchday highlight video. The stock video caption “Coach’s choice · the whole matchday” is removed. Selecting the award shows a gold celebration popup with trophy and congratulations. All 24 suites passed, including new reason persistence, limits, recipient cleanup, escaped HTML, export-block and video-canvas assertions. Phone viewing and encoded video/share verification remain pending.

## Award card mobile layout

The on-screen Match Report award is now a centred vertical card: uppercase title, larger player name, then optional reason. The reason has its own line height and no paragraph margins; long names and reasons wrap within the card. Relevant award and compact report regression suites passed. Phone visual confirmation remains pending.

## Compact location capture screen

Location capture now prioritises event/time, a short Shot Location heading, Rotate pitch and the pitch image. Assist/free-kick locations use corresponding short headings. Removed the attack/input-view label, dimensions/setup description and visible empty-selection status; changed Location unknown to Skip while preserving its existing unknown-location semantics. Keyboard help and location announcements remain available to assistive technology. Event/time typography is larger and location-only spacing is tighter. Missing-pitch setup recovery is retained. The existing regression suites passed; phone visual acceptance remains pending.

## Viewport-fitted pitch capture

Location sheets now use a single compact heading: action icon, event time, player/team and Add location. The header removes duplicate event/title rows and the extra top spacing. A flex layout keeps heading, Rotate pitch and Skip outside the pitch's resizable middle stage. The stage sizes the complete image to its available width/height without object-fit letterboxing, keeping the marker and image coordinate rectangles aligned; all four rotations use the selected template's viewBox ratio. The sheet fits the dynamic viewport with safe-area padding. Set-piece location screens use the same header/layout and retain Back.

Capture, geometry, skipped-location and full regression checks pass. The browser tool could not connect to the local preview, so this change has not been visually verified at a real mobile viewport. Phone checks of small portrait and landscape viewports remain required.
