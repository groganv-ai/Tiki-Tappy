# Approved pitch templates v2 — v5 integration

Source: user-supplied `exports/tikitapper-v5-pitch-templates-v2.zip`.
SHA-256: `5617a0d12ebbdb0eca6b5a8f8427f3fa73394e47d7398e8cc57d6ee4328ce95c`.
All packaged file hashes were verified against its `SHA256SUMS.json`.

## Behavior

- Age group and actual playing format are selected in **Matchday setup**, not
  during action recording. The suggested dimensions are shown there. Each match
  receives an independent template/geometry snapshot. U13 can select 9v9 or an
  actual 11v11 transition fixture; no format is inferred from player count.
- Existing drafts without template settings can add them through Edit current
  matchday details. Existing events are preserved. Once a configured match has
  started or has recorded events, setup locks its pitch settings.
- Goal, shot, assist and set-piece location screens immediately use the match's
  saved template. They offer direct selection, rotation and Unknown. Following
  usability feedback, tapping shows a framed action icon for 350 ms and advances
  automatically; there is no extra confirmation tap. Keyboard users can adjust
  with arrow keys and select with Enter.
  Corners/penalties retain their optional assumed locations and can also choose
  an explicit origin. No visible zone grid remains.
- Baked images select all six sizes, both teams and four orientations. There is
  no additional CSS rotation. Hit testing uses the image's actual bounds and
  variant viewBox, then undoes the baked rotation about (360,540). Taps outside
  the playing rectangle are rejected. Marker coordinates survive rotations.
- Saved fractional points are tagged `tikitapper-template-v2`, with preset ID,
  version, playing rectangle and drawing snapshot. Opposition images already
  face the correct way; points are not flipped again. No percentage rounding
  is applied to stored points.
- Highlight backgrounds draw the exact approved SVG marking paths from
  the saved snapshot using Path2D, including circular penalty Ds. Projection
  uses the playing rectangle. Palette, stripes, direction arrows and labels now
  match the selection templates. The U14+ enlarged boxes remain an explicitly
  schematic coordinate space, never silently mapped to regulation-scale boxes.
- Legacy numeric/zone-based points retain the previous renderer and meaning.
  If a linked location uses a different geometry, it is omitted from that pitch
  replay rather than projected onto an incompatible background. Its event data
  remains intact. There is no migration or rewrite of old events.

## Source layout

`assets/pitch-templates-v2/` contains the 48 approved rotation SVGs and original
metadata in a versioned directory. Existing untracked assets, experiments,
generator and documents from the separate design chat were not overwritten.
`tools/build-pitch-template-runtime.cjs` produces `pitch-template-data.js` from
those copies. Re-run it after an intentional approved asset update; new geometry
versions must use a new versioned directory and coordinate-space identifier.

The buildless browser loads `pitch-template-data.js` and `pitch-selector.js`.
Capture logic remains in the Step 4 modules. The shared location acceptance
functions retain the previous linked assist/save and set-piece flow.

## Validation

- All **20** `*tests.cjs` scripts pass.
- New pitch tests cover **3,130** coordinate assertions, including six presets,
  four rotations, both team image mappings and widths 320/768/1280; sidelines,
  box corners, penalty spots, centre and fractional points; outside rejection;
  draft/confirmation/cancellation; persistence; linked assist/Undo; set-piece
  origin/direct goal; saved penalty editing; clean replay path/point alignment;
  accessibility-generated clicks; legacy/new geometry separation.
- New setup tests cover required age/format, cloned match snapshots, no pitch
  dropdowns during action capture, settings lock, refresh recovery and adding
  settings to old drafts without changing events.
- Existing 32 saved-event/score comparisons and 12 Match Centre HTML comparisons
  against the accepted refactor baseline pass. Legacy zone functions remain as
  compatibility adapters and for historical regression coverage.
- Interactive local browser: configure U14/11v11 in demo settings; open goal
  capture directly on its green template; tap and rotate the marker; confirm
  the goal (score 1–0 → 2–0). Red template selection and marker rotation checked
  at 390×844 and 768×1024. Temporary viewport overrides were reset. The real
  saved draft was not changed by the demo checks.

## Remaining acceptance

Real iPhone/Safari touch accuracy, label readability and scrolling in all four
orientations still need testing. A complete generated video/share round trip
with new-template goals has not been interactively verified. Automated canvas
checks verify geometry projection but do not replace that export test.

Part A mobile sign-off and Step 4 acceptance remain separate. This integration
does not declare either complete. Localhost preview updated; no hosted test-site
publication, main merge or production deployment is part of this change.
