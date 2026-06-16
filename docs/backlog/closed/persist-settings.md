# Persist Service and Quality Settings

## Description
When queueing tracks, users frequently prefer a specific service (e.g., Qobuz) and quality (e.g., HI_RES_LOSSLESS). Currently, these selections reset to the defaults (Tidal, LOSSLESS) when the page is reloaded.

We should persist the user's selected `service` and `quality` choices in `localStorage` so they are remembered across sessions.

## Acceptance Criteria
- [ ] Changing the selected "service" saves the new value to `localStorage` under `savedService`.
- [ ] Changing the selected "quality" saves the new value to `localStorage` under `savedQuality`.
- [ ] On page load, the service and quality dropdowns should be populated with the values from `localStorage` if they exist.
- [ ] Add a Playwright test to verify that the settings are persisted across page reloads.
