# Add system theme option to web UI

## Description
Currently, the SpotiFLAC web UI has a simple light/dark theme toggle button. It checks the system preference once on load but then explicitly sets `light` or `dark` in local storage. This overrides the system preference and does not respond to system changes if the user hasn't explicitly clicked the toggle, or if they have but later change their OS theme.

## Requirements
- Add a "System" theme option.
- Users should be able to choose between "Light", "Dark", and "System".
- If "System" is chosen, the UI should dynamically respond to OS-level `prefers-color-scheme` changes.
- Ensure the current theme state is visually indicated (e.g. replacing the single toggle button with a dropdown, or a multi-state button, or a set of icons).
- Update the `index.html` inline script to support 'system' as a valid theme value in localStorage.
- Update `app.js` and `styles.css` to accommodate the change.
- Add/update Playwright tests for the theme switching functionality.
