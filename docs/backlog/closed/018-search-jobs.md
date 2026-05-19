# Search jobs by URL or ID

Users need to quickly find specific jobs, especially when the queue gets long.
Add a search input box in the "Recent jobs" section that filters the displayed jobs by checking if the search text is present in the job URL or job ID.
The search should be case-insensitive and update as the user types (or when `fetchJobs` is triggered).

## Requirements
1. Add a text input field to the recent jobs header.
2. Filter the `jobs` list fetched from `/api/jobs` on the frontend before rendering.
3. Update unit/e2e tests in Playwright to verify filtering behavior.
