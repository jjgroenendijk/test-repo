# Clear Running Jobs
## Requirement
Add a 'Clear running' button next to the other clear history buttons to allow the user to easily cancel and clear all jobs currently in the 'Running' or 'Queued' status, freeing up the queue and UI.

## Implementation details
- Add a button in the frontend near 'Clear cancelled'.
- Add an API endpoint `DELETE /api/history/clear-running` in `server.py` to cancel and remove running and queued jobs.
- Tests should be written for both.
