# Clear History Feature

**Goal**: Allow users to clear non-active jobs from their SpotiFLAC history to keep the UI tidy.

**Requirements**:
1. A new backend endpoint `DELETE /api/history/clear` that filters the `history.json` file.
   - It must remove any jobs with a status of "Completed", "Failed", or "Cancelled".
   - It must retain any jobs with a status of "Queued" or "Running".
2. A new "Clear history" button in the frontend job list section.
   - Clicking it calls the new backend endpoint.
   - The UI should refresh the job list afterward.
3. Tests for backend endpoint.
4. Playwright tests for frontend feature.
