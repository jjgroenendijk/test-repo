# 019 Add storage percentage display

## Goal
Show the current storage usage percentage inside the SpotiFLAC web UI so users know exactly how full their `/data` volume is without needing to hover over the bar or calculate it manually.

## Implementation details
- Update `website/src/app.js`'s `updateStorageUsage()` function.
- Find or create an element next to or inside the storage progress section to show the calculated percentage as text (e.g., `42% used`).
- Add a Playwright test if necessary to assert its presence and format.
