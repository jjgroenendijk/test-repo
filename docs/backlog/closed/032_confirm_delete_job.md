# Confirm Delete Job

Add a confirmation dialog before deleting an individual job, similar to the cancel job confirmation.

## Requirements
- When a user clicks the "Delete" button for a job, prompt them with `window.confirm`.
- The prompt should ask: "Are you sure you want to delete this job? This cannot be undone."
- If the user cancels the prompt, do not delete the job.
- If the user confirms, proceed with the deletion.
- Write/update a Playwright test to verify this behavior.
