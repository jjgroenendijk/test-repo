# Filter Jobs by Status

## Description
Add a dropdown filter to the SpotiFLAC Web UI's job list. This feature allows users to filter jobs based on their current status (e.g., All, Queued, Running, Completed, Failed, Cancelled) to make it easier to find specific jobs, especially when the history is long.

## Tasks
- Add a dropdown (`<select>`) next to the "Clear history" button in the UI.
- Update `app.js` to handle the dropdown state and filter the jobs list based on the selected value before rendering.
- Add CSS styling in `styles.css` to match the "Apple Liquid Glass" style guide.
- Add test coverage in `web-ui.spec.js` to ensure the filtering logic works correctly.
