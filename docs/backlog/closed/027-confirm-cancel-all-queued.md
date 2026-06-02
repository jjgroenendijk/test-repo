# Confirm Cancel All Queued Jobs

## Requirement
The web UI has a "Cancel all queued" button. Clicking this button immediately cancels all queued jobs. This can be destructive and happen accidentally.
We need to add a confirmation dialog before cancelling all queued jobs to prevent accidental clicks.

## Tasks
- Add a `window.confirm` dialog to the `#cancel-all-queued-btn` click event listener in `website/src/app.js` with the message "Are you sure you want to cancel all queued jobs? This cannot be undone.".
- If the user clicks "Cancel" (dismisses the dialog), do not execute the API request.
- Add a Playwright UI test to verify the confirmation dialog appears and that the API request is made when accepted.
