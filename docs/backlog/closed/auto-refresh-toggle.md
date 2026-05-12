# Auto-Refresh Toggle

## Requirement
As a user of the SpotiFLAC web UI, I want to be able to pause the automatic 5-second polling interval for jobs. This is useful if I am inspecting logs or files and do not want the UI state to potentially shift, or if I just want to reduce network requests while idle.

## Implementation Details
1. Add a checkbox or toggle switch next to the "Refresh jobs" button in the UI.
2. Label it "Auto-refresh".
3. When checked (default), the 5-second interval for fetching jobs runs normally.
4. When unchecked, the interval is cleared.
5. Save the toggle state in `localStorage` so it persists across page reloads.
6. The state should affect the main job fetching loop in `app.js`.
