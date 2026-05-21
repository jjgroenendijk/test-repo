# Queue Status Summary

## Description
As a user, I want to see a summary of the current job statuses (Queued, Running, Completed, Failed) at a glance above the job list, so I can quickly understand the system's overall state without manually counting items.

## Acceptance Criteria
- A summary text block (e.g., "Queued: X | Running: Y | Completed: Z | Failed: W") is displayed above the `.job-list` container.
- The summary automatically updates whenever the job list is refreshed (e.g. periodically, or when a job finishes).
- Missing statuses should show 0 or be omitted.

## Technical Tasks
- Modify `website/src/app.js` to add `#queue-status-summary` element in the DOM template.
- Update the `fetchJobs` function in `app.js` to calculate the status counts and render them in the new element.
- Add an automated UI test in `website/src/app.test.js` validating the display logic.
