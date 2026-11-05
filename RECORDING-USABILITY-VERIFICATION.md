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
