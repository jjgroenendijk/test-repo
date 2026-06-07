# Feature: Delete All Jobs Button

## Context
Currently, users can clear jobs by status (completed, failed, running, queued, cancelled) or clear all history (which clears non-running jobs).
We need a single button to "Delete All Jobs" that completely clears all jobs, regardless of their status (including running and queued jobs).
It should prompt the user for confirmation before proceeding.

## Requirements
1. Add a "Delete All Jobs" button to the UI (e.g., next to the "Clear history" button).
2. It should have a confirmation dialog ("Are you sure you want to delete all jobs, including running ones? This cannot be undone.").
3. It should call an API endpoint (e.g., `DELETE /api/jobs/all` or combine existing clear logic) to delete everything.
4. After deleting, it should fetch jobs to update the UI.
5. Add a Playwright test to verify this functionality.

## Technical Notes
- The backend might need a new endpoint or the UI can call multiple endpoints if a single endpoint isn't practical.
- A new endpoint `DELETE /api/jobs` or similar might be best to cleanly cancel/delete running processes and clear the database.
