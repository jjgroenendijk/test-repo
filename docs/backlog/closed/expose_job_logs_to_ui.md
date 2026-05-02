# Expose SpotiFLAC job logs to the UI

## Objective
Currently, the UI displays `error_log` from the `job` if it fails, but it would be very helpful for the user to be able to see the full log output while the job is running or after it's completed, rather than just the error snippet.

## Requirements
- Create an API endpoint in the FastAPI backend (e.g. `/api/jobs/{job_id}/log`) to stream or fetch the log file contents for a given job.
- Since SpotiFLAC can take a while to download entire playlists, streaming or polling logs while running is preferred.
- Update the frontend UI to include a "View Logs" button or section for each job, which opens a modal or expands the card to show the log content.
