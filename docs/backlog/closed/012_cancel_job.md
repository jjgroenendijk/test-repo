# Add 'Cancel Job' Feature

## Context
Users currently can queue jobs but cannot cancel them if they make a mistake or the job takes too long.

## Requirements
- Add a "Cancel" button to jobs that are in "Queued" or "Running" state in the UI.
- Add a DELETE endpoint to `/api/jobs/{job_id}` in `server.py` to cancel a job.
- Update `run_spotiflac` in `server.py` to support cancellation. We can keep track of running tasks or use subprocess methods.
- Update history.json with status "Cancelled".
- Update Playwright and Python unit tests.
