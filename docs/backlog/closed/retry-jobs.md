# Retry Failed/Cancelled Jobs

## Requirement
Currently, if a job fails or is cancelled, there is no easy way for the user to try again without copying the URL and manually pasting it back into the queue form.
To improve the user experience, we should add a "Retry" button to jobs that are in a "Failed" or "Cancelled" state.

## Tasks
- Add a "Retry" button inside the job card actions when the job status is "Failed" or "Cancelled".
- Style the "Retry" button using the existing Apple Liquid Glass aesthetic.
- Clicking the "Retry" button should issue a POST request to `/api/jobs` with the URL from the failed/cancelled job to queue it again.
- The job list should visually update to reflect the newly queued job immediately.
- Add appropriate Playwright tests to ensure the "Retry" button appears for the correct job states and functions as expected.
