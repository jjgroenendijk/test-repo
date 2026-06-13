# Add Backend Connection Status Indicator

As a user self-hosting SpotiFLAC, I want to know if the backend server is reachable from the web UI so I can quickly diagnose connectivity issues.

## Requirements
- Add a small visual indicator (like a colored dot or badge) to the top bar (e.g., next to the theme toggle or runtime badge).
- The indicator should be green and say "Online" or just be green when the backend is reachable.
- It should be red and say "Offline" (or just red) when the backend is unreachable.
- Use the existing `/api/health` endpoint or hook into the existing periodic job polling (`fetchJobs`) to update the status.
- Ensure the UI looks clean and matches the "Liquid Glass" style guide.
- Add Playwright tests to verify the indicator works properly.
