# TikiTapper v0.2

Mobile-friendly youth football matchday tracker.

This is a buildless static app. Current refactor work is on v5, with a separate private test Site. Main remains unchanged; merging or publishing main requires separate authorization.

## Features

- Matchday setup, team selection and player lineups
- Player and Coach modes
- Half-aware match clock with added time
- Goals, linked assists and positive player actions
- Undo, timeline, match reports and animated highlights
- Player of the Day

## Data

Free matchdays start with a blank team name and squad. Players are entered once per matchday and reused across its matches. Both Coach and Player modes remain available. One temporary localStorage draft supports refresh recovery. End matchday opens review and report creation; deleting the draft or replacing it with a new matchday requires confirmation. Download or share anything you want to keep. No reusable squad library or new match archive is provided.

The demo uses randomised fictional boys’ and girls’ names and does not overwrite a real draft. Previous-version local match records are retained for explicit export/clear rather than silently deleted. Old squad-sharing URL imports are retired.

Photos require an unchecked-by-default permission acknowledgement, are re-encoded to JPEG without the original file metadata, and remain in the temporary browser draft unless exported/shared. Sharing previews include a permission reminder. The acknowledgement is not a substitute for obtaining consent or complying with club safeguarding policies.

No installation or build step is required. All asset paths are relative to support repository-based GitHub Pages URLs.


## v0.2 browser trial

Use Try a demo to explore without changing an existing matchday. The fictional demo contains one U14 11v11 game, a 4–4–2 starting team and a 2–1 half-time lead. Start the second half to continue recording.

New matchdays default to Player mode with full names; Coach mode is also available. Matchday setup selects age group and playing format. Reports offer By action, Timeline and Player summary. Content presets select events for action/timeline reports and highlights; Player summary counts all recorded player actions. Player of the Day can include an optional reason in the report and highlights.

All draft data stays in this browser. Download/share reports and videos to keep separate copies. The free experience disables the old backup-import and reusable-squad flows; it retains earlier local match records for explicit export/clear.

## Refactor status and verification

See [Final architecture review](FINAL-ARCHITECTURE-REVIEW.md) for current ownership, residual migration debt and acceptance limits. See [Step 4](STEP-4-ACTION-RECORDING.md) and [Step 5](STEP-5-REPORTS-EXPORT.md) for implementation details. Historical status notes in those files describe their original implementation stage; later sections and the final review describe the current private preview.

Run the regression scripts with Node (no dependency installation is required):

```powershell
Get-ChildItem -Filter '*tests.cjs' | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "Failed: $($_.Name)" }
}
```

Mobile rotation/touch/hold acceptance and a real encoded-video/save/share round trip remain pending. Automated recorder tests use simulated browser events and do not replace that acceptance.
