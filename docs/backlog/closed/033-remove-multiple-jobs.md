# Remove Multiple Selected Jobs

## Background
Currently, users can only clear completed, failed, or cancelled jobs, or delete jobs one by one. It would be helpful to allow users to select multiple specific jobs and delete them at once.

## Requirements
- Add a checkbox to each job card in the history list.
- Add a "Delete Selected" button that appears when at least one job is selected.
- The button should trigger a confirmation dialog before deleting the selected jobs.
- The backend should support deleting multiple jobs via a single API call or the UI should loop and call the delete endpoint for each job and refresh the list.
- Add Playwright tests to verify the behavior.
