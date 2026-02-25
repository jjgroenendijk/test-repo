# Resolution Limit

## Description
Allow users to select a maximum video resolution (e.g., 720p, 1080p, 4K) when downloading videos.

## Rationale
"Best Video + Audio" often downloads 4K or 8K files which are huge. A common user requirement for `yt-dlp` wrappers is resolution control to save disk space and bandwidth.

## Requirements
- Add a resolution dropdown to the UI (Video mode only).
- Pass the resolution to the backend.
- Use `yt-dlp` arguments to limit resolution (e.g., `bestvideo[height<=720]+bestaudio/best[height<=720]`).
- Store the resolution in the download history.
