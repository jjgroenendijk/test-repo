# Retry Download (Prefill Form)

## What
Add a "Retry" or "Load into Form" button to each history item in the downloader dashboard.

## Why
Users often want to retry a failed download or re-download a file with slightly different settings (e.g., change format, include playlist). Currently, they have to manually copy the URL and re-select the options. This feature streamlines that workflow.

## Acceptance Criteria
- [ ] Each history item has a "Retry" button.
- [ ] Clicking "Retry" populates the download form with the URL, Mode, and Playlist setting from the history record.
- [ ] Clicking "Retry" scrolls the page to the top (where the form is located).
- [ ] The form state (URL, Mode, Playlist) is updated to match the selected record.
