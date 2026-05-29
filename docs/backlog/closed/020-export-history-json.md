# Export History as JSON

## Objective
Provide users with a way to export their entire job history as a JSON file from the web UI. This is a high-value feature for users who self-host and want to back up or migrate their downloaded media history.

## Scope
- Add a new endpoint `GET /api/history/export` in `server.py` that returns the `history.json` content as a downloadable `.json` file.
- Add an "Export History JSON" button to the frontend UI in `website/src/app.js` (e.g., next to the clear history buttons).
- Write a Playwright/unit test in `website/src/app.test.js` to ensure the button is rendered and has the correct `href`.
