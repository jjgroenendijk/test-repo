# Add "Download All" button to SpotiFLAC web UI

The user needs a way to download all files from a completed job as a single ZIP archive.
Currently, there is a `/api/jobs/{job_id}/download` endpoint, but it needs to be integrated into the UI.

## Requirements:
1.  **UI Component:** Add a "Download All" button to the job details view in the frontend.
    -   The button should be visible only for jobs with a status of "Completed".
    -   The button should match the "Apple Liquid Glass" style guide.
    -   Clicking the button should trigger a download of the ZIP archive from `/api/jobs/{job_id}/download`.
2.  **Testing:** Add a Playwright test to verify the functionality of the new button.
