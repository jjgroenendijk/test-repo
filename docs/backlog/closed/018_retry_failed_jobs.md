# Add "Retry" functionality for failed jobs in SpotiFLAC Web UI

**Goal**: Allow users to quickly retry failed jobs directly from the SpotiFLAC web UI's job history.

Currently, if a job fails due to network issues, rate limiting, or transient errors, the user has to manually copy the original Spotify URL and submit it as a new job again. We should add a "Retry" button to failed jobs in the history list.

### Requirements:
1. **Frontend UI**:
   - Add a "Retry" button to the job card of any job with a status of "Failed".
   - The button should trigger a new API request to queue the original URL.
   - Upon successful queueing, the UI should ideally show some feedback or simply rely on the auto-refresh to pick up the new queued job.

2. **Backend API**:
   - The existing `POST /api/jobs` endpoint takes a JSON payload `{"url": "..."}`. We can reuse this endpoint from the frontend by extracting the URL from the failed job's data.

3. **Testing**:
   - Add/update Playwright tests to cover clicking the Retry button on a failed job and verifying that a new job request is made.
