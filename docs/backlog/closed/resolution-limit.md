# Resolution Limit

## Description
Add a "Resolution Limit" dropdown to the downloader dashboard. This allows users to specify a maximum video resolution (e.g., 1080p, 720p) to save storage space and bandwidth.

## Requirements
- [ ] Frontend: Add a dropdown with options: "Best", "4K", "1440p", "1080p", "720p".
- [ ] Frontend: Send selected resolution to the backend.
- [ ] Backend: Receive `resolution` parameter.
- [ ] Backend: Update `yt-dlp` arguments to respect the resolution limit.
- [ ] Backend: Store resolution preference in history? (Optional but good for Retry).
- [ ] Tests: Add unit/E2E tests for the new feature.
