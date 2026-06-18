# Prevent Dark Mode FOUC

## Description
When a user visits the SpotiFLAC web UI and they have dark mode enabled (via `localStorage` or `prefers-color-scheme`), there is a flash of unstyled content (FOUC) where the page briefly loads in light mode before the JavaScript in `app.js` runs and applies the `dark` class to the `<html>` element.

## Acceptance Criteria
- A script should be added to the `<head>` of `website/index.html` that synchronously checks `localStorage` and `matchMedia` to apply the `dark` class before the body is parsed.
- This prevents the screen from flashing white when reloading the page in dark mode.
- The existing logic in `app.js` that initializes the theme should be retained to keep the UI components (like the toggle button) in sync.
