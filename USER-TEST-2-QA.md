# User Test 2 — Phase 1 QA checklist (development branch only)

Reference: FAW Small-Sided Football Regulations 2025/26, https://faw.cymru/small-sided-football/

## Age groups and field dimensions
- U6–U7: 4v4, 28×20 yd, no goal area.
- U8–U9: 5v5, 35×25 yd, 7×12 yd goal area.
- U10–U11: 7v7, 44×40 yd, 10×15 yd goal area.
- U12: 9v9, 64×44 yd, 12×28 yd penalty area.
- U13: 9v9, 76×44–54 yd, 12×28 yd penalty area.
- U14–U17: 11v11. Existing full-size pitch is retained as an illustrative template.
- Junior pitch widths and markings should be verified against FAW diagrams before release. The app is not a substitute for local league regulations.

## Browser checks required before release
1. Create U10 matchday; verify selected age persists through refresh and all games.
2. Create U14 matchday; verify full-size markings.
3. Record our goal at north six-yard area; check replay and exported event.
4. Record opposition goal at visually north six-yard area; check saved point is southern half and replay still targets opposition attack.
5. Flip pitch; select same physical zone; verify stored coordinates are not corrupted.
6. Reload mid-match; verify flip preference is retained for the current match.
7. Switch to next match; verify flip preference is independent.
8. Verify assist location selection, saved-shot/keeper selection and standalone set pieces.
9. Import older JSON matchday and verify reports/replay unchanged.
10. Test mobile Safari touch targets and the pitch on a narrow screen.

## Known remaining work
- Browser and device execution of checks above.
- Ensure saved coordinates and replay orientation are semantically consistent for all flows.
- Extend pitch renderer to video canvas after verifying age-specific SVG rendering.
- Add per-team remembered age preference without retaining unwanted personal data.
- Phase 1 set-piece shortcuts and formation-based Coach Mode selection.

## Phase 1 event and Coach Mode checks
11. Goal/Shot capture defaults to Open Play without an extra tap.
12. Select Free Kick, Corner and Penalty during Goal/Shot entry; confirm each remains a single parent event with its existing linked assist/save.
13. Confirm standalone Corner/Free Kick/Penalty capture remains available.
14. Confirm the set-piece report does not double-count integrated Goal/Shot events.
15. In Coach Mode, scorer selection shows the current on-pitch formation, including goalkeeper, and excludes substitutes from active choices.
16. Toggle the Coach Mode scorer selector to list view and back.
17. Record a substitution; confirm Coach Mode reflects the new on-pitch player.
18. Validate all JavaScript syntax, then test on iPhone Safari and desktop before merging.
