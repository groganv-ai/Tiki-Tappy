# TikiTapper v0.2

Mobile-friendly youth football matchday tracker.

This is a buildless static app. Publish the repository root with GitHub Pages.

## Features

- Matchday setup, team selection and player lineups
- Player and Coach modes
- Half-aware match clock with added time
- Goals, linked assists and positive player actions
- Undo, timeline, match reports and animated highlights
- Player of the Day

## Data

Free matchdays start with a blank team name and squad. Players are entered once per matchday and reused across its matches. Both Coach and Player modes remain available. One temporary localStorage draft supports refresh recovery; Finish matchday clears it after confirmation. Download or share reports before finishing. No reusable squad library or new match archive is provided.

The demo uses randomised fictional boys’ and girls’ names and does not overwrite a real draft. Previous-version local match records are retained for explicit export/clear rather than silently deleted. Old squad-sharing URL imports are retired.

Photos require an unchecked-by-default permission acknowledgement, are re-encoded to JPEG without the original file metadata, and remain in the temporary browser draft unless exported/shared. Sharing previews include a permission reminder. The acknowledgement is not a substitute for obtaining consent or complying with club safeguarding policies.

No installation or build step is required. All asset paths are relative to support repository-based GitHub Pages URLs.


## v0.2 browser trial

Use Try a demo to explore without changing existing matches. Coach mode now offers five action-first buttons; Player mode remains the default for new matches. Reports offer selectable 30–180 second highlights. All data is saved in this browser only; export a backup before switching devices. The release-v0.1 branch preserves the previous version.
