# Display System Info in UI

## Goal
Display the backend system information (version and platform) in the web UI.

## Why
The backend already exposes a `/api/system/info` endpoint returning the version and platform. Exposing this in the UI (e.g., in the footer) is helpful for users self-hosting the app to verify which version they are running.

## Acceptance Criteria
- Fetch `/api/system/info` on app load.
- Display the version and platform at the bottom of the page in a `.system-info` container.
- Include an automated Playwright test for the new element.
