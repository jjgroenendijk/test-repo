# Add System Storage API Endpoint

The web UI requires a way to view server storage capacity and data directory paths to ensure the homelab environment has sufficient space for SpotiFLAC downloads.

## Requirements
- Add a new API endpoint `GET /api/system/storage`.
- Return basic storage statistics: path, total space, free space, and used space.
- Display this information somewhere in the web UI.
- Ensure the backend calculates this dynamically.
- Update `website/playwright.config.js` or UI to reflect this if needed.
- Write a Playwright test.
