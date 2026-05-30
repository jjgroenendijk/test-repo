# Add Job Execution Duration Display

## Description
Display the execution duration (time elapsed between job creation and completion) on the job cards for completed, failed, and cancelled jobs in the web UI. This provides better visibility into system performance for homelab users.

## Tasks
1. Update `website/src/app.js` to parse `created_at` and `completed_at` and format the duration (e.g., 'Duration: 1m 23s').
2. Render this duration next to the 'Completed: ...' timestamp.
3. Add a unit test in `website/src/app.test.js` to verify the duration is calculated and rendered correctly.
4. Update mock jobs in Playwright tests to include `completed_at` where necessary to prevent regressions.
