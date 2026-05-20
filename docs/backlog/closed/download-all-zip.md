# Requirement: Download ZIP button for all completed jobs

## Description
The user needs a way to download all completed jobs as a single ZIP file. Currently, the backend has an endpoint (`/api/history/download`) to handle this, but the UI button is hidden (`display: none;`).

## Acceptance Criteria
- The "Download all completed" button is visible in the frontend UI.
- Clicking the button initiates a download via `/api/history/download`.
- A frontend unit test verifies the button is rendered and has the correct `href`.