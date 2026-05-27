# Clear Cancelled Jobs

## Context
The SpotiFLAC web UI allows users to clear completed and failed jobs from their history. However, there is currently no way to quickly clear cancelled jobs from the history other than clicking delete on each one manually or clearing the entire history.

## Requirement
Add a "Clear cancelled" button to the job list actions that allows the user to clear all cancelled jobs from the history at once.

## Acceptance Criteria
1. A `DELETE /api/history/clear-cancelled` endpoint is available on the backend to remove only jobs with status "Cancelled".
2. The UI has a "Clear cancelled" button alongside the existing "Clear completed" and "Clear failed" buttons.
3. Clicking the button calls the endpoint, clears cancelled jobs, and refreshes the job list.
