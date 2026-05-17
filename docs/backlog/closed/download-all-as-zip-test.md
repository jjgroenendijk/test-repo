# Playwright test for 'Download all completed' button

## Requirement
The UI has a "Download all completed" button that triggers a download of all completed jobs as a ZIP archive. This functionality should be covered by a Playwright test to ensure it remains working.

## Tasks
1. Add a Playwright test in `website/tests/web-ui.spec.js` to verify that the "Download all completed" button appears when there are completed jobs, and successfully triggers a download via `/api/history/download`.
