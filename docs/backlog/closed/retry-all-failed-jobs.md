# Retry All Failed Jobs

## Requirement
Add a "Retry All Failed" button to the job list header. This button should queue up new jobs for every currently failed job, saving the user from clicking "Retry" on each individual failed job manually.

## Implementation Plan
1. Add a `<button type="button" id="retry-failed-btn" class="clear-history-btn" style="border-color: rgba(234, 179, 8, 0.5); color: #eab308;">Retry failed</button>` in `website/src/app.js` next to "Clear failed".
2. Attach an event listener to the button that:
   - Fetches the list of all jobs from `/api/jobs`.
   - Filters the jobs to only those with `status === "Failed"`.
   - Calls the `POST /api/jobs` endpoint for each failed job's URL.
   - Refreshes the job list.
3. Write a Playwright test to verify the functionality.
