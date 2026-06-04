# Confirm Cancel Job

## Requirement
The web UI has a "Cancel" button for individual queued/running jobs. Clicking this button immediately cancels the job. This can be destructive and happen accidentally.
We need to add a confirmation dialog before cancelling a single job to prevent accidental clicks.

## Tasks
- Add a `window.confirm` dialog to the `#cancel-job-btn` click event listener in `website/src/app.js` with the message "Are you sure you want to cancel this job?".
- If the user clicks "Cancel" (dismisses the dialog), do not execute the API request.
- Add a Playwright UI test to verify the confirmation dialog appears and that the API request is made when accepted.
