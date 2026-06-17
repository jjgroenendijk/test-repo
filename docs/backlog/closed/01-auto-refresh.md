# Play/Pause UI for Auto-refresh polling

Currently, there are two distinct controls for polling:
1. `auto-refresh-toggle` (a checkbox) that starts/stops an interval on change.
2. `pause-polling-btn` (a button) that toggles `isPollingPaused` flag inside the interval.

These controls should be unified into a single Play/Pause button for better user experience.

1. Remove `auto-refresh-toggle` checkbox and its label.
2. Repurpose `pause-polling-btn` to be a toggle button (Play/Pause Auto-refresh).
3. The interval should keep running (or be cleared/recreated) based on the state. It's simpler to keep the interval running but just toggle the `isPollingPaused` flag, and update the button text to show the current state ("Pause Auto-refresh" / "Resume Auto-refresh").
4. Update `localStorage` to save the "isPollingPaused" state instead of "autoRefresh".
