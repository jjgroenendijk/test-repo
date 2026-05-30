# Display Job Execution Duration

## Requirement
As a user, I want to see the execution duration for completed, failed, and cancelled jobs in the SpotiFLAC web UI so that I can monitor system performance and job runtimes.

## Implementation Details
1. Modify `website/src/app.js` and specifically the `renderJob(job)` function.
2. If `job.completed_at` is set, parse `job.created_at` and `job.completed_at` into `Date` objects.
3. Calculate the difference in milliseconds and format it into a human-readable string (e.g. `1m 23s` or `45s`).
4. Display the formatted duration in the `.job-source` element where `Completed:` timestamp is rendered.
5. Add relevant unit tests if necessary (though the E2E tests and simple UI modification should suffice for basic functionality validation).
