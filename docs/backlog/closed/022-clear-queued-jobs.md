# Requirement: Clear Queued Jobs

**Value:** Medium
**Description:** Users should be able to clear all currently queued jobs to manage the job queue.

**Tasks:**
1. Add a "Clear queued" button in the frontend (e.g., next to the clear running/history buttons).
2. Wire it up in the frontend to call a new `DELETE /api/history/clear-queued` endpoint.
3. Implement the `DELETE /api/history/clear-queued` endpoint in the backend (`server.py`) which updates the status to cancelled for queued jobs or removes them.
4. Write Playwright test to verify this UI.

**Acceptance Criteria:**
- The new button allows clearing jobs that are specifically in the `Queued` state.
- Playwright tests pass.
