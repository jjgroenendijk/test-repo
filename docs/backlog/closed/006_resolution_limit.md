# Resolution Limit for Video Downloads

## Status
Closed

## Description
Add a resolution limit option to the `yt-dlp` web interface. Users should be able to select a maximum resolution (e.g., 1080p, 720p) when downloading videos. This helps in managing disk usage and bandwidth.

## Requirements
- [x] Update `DownloadRequest` interface to include optional `resolution` field.
- [x] Update `buildYtDlpArgs` to handle resolution limits.
- [x] Update frontend UI to include a resolution dropdown (visible only for video mode).
- [x] Ensure resolution is passed to the API and stored in history.
- [x] Add tests for the new functionality.

## Implementation Details
- Used `bestvideo[height<=HEIGHT]+bestaudio/best[height<=HEIGHT]` format string for `yt-dlp`.
- Supported resolutions: Best, 4K (2160p), QHD (1440p), FHD (1080p), HD (720p).
