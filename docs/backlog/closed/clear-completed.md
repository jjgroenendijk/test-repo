# Clear Completed Jobs

## Requirement
Add a 'Clear completed' button to the web UI that allows users to easily clear all jobs with the 'Completed' status. This keeps the UI tidy and saves space without wiping out running or failed jobs that might still need attention.

## Implementation Details

### Backend
- Add `DELETE /api/history/clear-completed` endpoint in `server.py` similar to the existing `clear-failed` logic. It will iterate through the job history, keep non-completed jobs, and clear the completed jobs along with their corresponding files and logs.

### Frontend
- Update `website/src/app.js` to render a new `<button>` for 'Clear completed'.
- Add an event listener that prompts for confirmation and then calls the new endpoint via `DELETE`, triggering a UI refresh on success.
