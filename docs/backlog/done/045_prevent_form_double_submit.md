# 045_prevent_form_double_submit

## Objective
Prevent the Add Job form from double submitting when the user rapidly clicks the submit button or presses enter multiple times.

## Background
Currently, if a user clicks "Add Job" multiple times quickly while the network request is still pending, it sends multiple POST requests to the `/api/jobs` endpoint, creating duplicate jobs.

## Acceptance Criteria
- While a job submission is pending, the "Add Job" button should be disabled.
- The button text should optionally change to indicate loading state (e.g. "Adding...").
- Once the request completes (success or failure), the button should be re-enabled and text restored.
