# Sort Jobs by Newest First

## Objective
The SpotiFLAC web UI currently displays jobs in the order they are returned by the API. To improve user experience, the UI should display the most recently created jobs at the top.

## Requirements
- Sort jobs by the `created_at` field in descending order (newest first) in the frontend before rendering.
- Update unit tests in `app.test.js` to verify this sorting behavior.
- Run quality checks and move this file to `closed/` upon completion.
