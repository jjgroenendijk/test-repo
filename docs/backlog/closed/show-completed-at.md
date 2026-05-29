# Add "Completed At" timestamp to jobs

When a job reaches a final state (Completed, Failed, or Cancelled), the backend should record a `completed_at` timestamp.
The web UI should display this timestamp on the job card, showing when the job was finished, similarly to how it displays the creation time.

Requirements:
- Add `completed_at` field to `JobResponse` in `server.py` and job history logic.
- Update `app.js` to render `completed_at` if available on the job card.
- Add unit tests for the backend to verify the timestamp is set and preserved.
- Ensure the UI handles missing `completed_at` gracefully (for older jobs).
