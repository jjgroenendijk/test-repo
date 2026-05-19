# Clear Failed Jobs

## Problem
Currently, the UI has a "Clear history" button that clears all non-running history. However, users who occasionally encounter failed downloads have no easy way to clear *only* the failed jobs without losing their successfully completed history.

## Solution
Add a "Clear failed" button next to the "Clear history" button.
When clicked, it sends a `DELETE` request to a new `/api/history/clear-failed` endpoint on the backend, which will remove all jobs with `status == "Failed"` from the `history.json` and clean up their associated files/logs.
