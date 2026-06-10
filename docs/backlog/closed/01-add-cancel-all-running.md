# Backlog Item: Add "Cancel all running" feature

## Overview
Currently, the UI has buttons to clear jobs of different statuses and a button to "Cancel all queued". However, there is no button to "Cancel all running". This would be useful if a user wants to stop all actively executing jobs without clearing them from the history.

## Implementation Details
1. Backend (`server.py`):
   - Add a new endpoint `POST /api/jobs/cancel-running` that iterates through history, finds all "Running" jobs, sets their status to "Cancelled", and terminates their processes.
2. Frontend (`website/src/app.js`):
   - Add a `<button type="button" id="cancel-all-running-btn" class="clear-history-btn btn-running">Cancel all running</button>` to the UI controls.
   - Add an event listener to call the new API and show a confirmation prompt similar to other bulk actions.
3. Tests (`website/tests/`):
   - Add a Playwright test to verify the new button and its functionality.
