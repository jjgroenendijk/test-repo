# Backlog: Download Job Form

Create a web UI to submit SpotiFLAC download jobs.

The user should be able to:
- Enter a Spotify URL.
- Optionally select a quality setting (128kbps, 256kbps, 320kbps).
- Click a button to submit the job.
- See basic validation (e.g., URL cannot be empty).

For now, the UI can just simulate submission and print to the console or display a dummy success message. Actual API integration will come later.

Testing:
- Write a Playwright test to verify the form exists, accepts input, and shows a submission message.
