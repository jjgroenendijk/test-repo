# Backlog Item: Auto-refresh Job Logs

## Goal
Automatically refresh the job logs when viewing them in the UI, especially when the job is "Running".

## Background
Currently, the user has to click "Refresh Logs" manually to see new log output while a job is running. Adding an auto-refresh toggle or behavior would improve the UX for tracking progress.

## Acceptance Criteria
- When a user views the logs of a "Running" job, the logs should automatically refresh periodically (e.g., every 3 seconds).
- There should be a visual indicator or toggle to show that logs are auto-refreshing.
- Add an automated test for this behavior.
