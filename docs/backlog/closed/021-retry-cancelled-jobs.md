# Retry Cancelled Jobs

## Requirement
Add a "Retry cancelled" button to the job list header. This button should queue up new jobs for every currently cancelled job, saving the user from clicking "Retry" on each individual cancelled job manually.

## Implementation Plan
1. Add a `<button type="button" id="retry-cancelled-btn" class="clear-history-btn" style="border-color: rgba(156, 163, 175, 0.5); color: #9ca3af;">Retry cancelled</button>` in `website/src/app.js` next to "Clear cancelled".
2. Attach an event listener to the button that:
   - Fetches the list of all jobs from `/api/jobs`.
   - Filters the jobs to only those with `status === "Cancelled"`.
   - Calls the `POST /api/jobs` endpoint for each cancelled job's URL.
   - Refreshes the job list.
3. Write a Playwright test to verify the functionality.
