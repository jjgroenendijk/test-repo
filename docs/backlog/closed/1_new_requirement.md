# Provide option to retry selected jobs

## Context
When a user selects multiple jobs via checkboxes, there should be an option to retry them, similar to the existing options to clear selected jobs, retry failed jobs, retry completed, etc.

## Change
In the web UI, add a "Retry selected" button which sends a retry request for all the currently selected jobs if they are in a retryable state (Completed, Failed, or Cancelled).

## Backend
We can achieve this by iterating over the selected job IDs, and for those that are retryable, issuing the existing retry logic or a new API endpoint. Currently, `retry` is implemented on the frontend by sending a new job request using the old job's URL, service, and quality.
