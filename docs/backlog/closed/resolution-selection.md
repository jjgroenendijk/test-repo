# Add Resolution Selection to Downloader

## Description
The current downloader defaults to "best video + audio". Users should be able to select a maximum resolution (e.g., 1080p, 720p) to save space or bandwidth.

## Requirements
- [x] Add a resolution dropdown to the UI (Best, 4K, 1440p, 1080p, 720p).
- [x] Pass the resolution parameter to the backend.
- [x] Update `yt-dlp` arguments to respect the resolution limit (e.g. `bestvideo[height<=1080]+bestaudio/best[height<=1080]`).
- [x] Store the selected resolution in the download history.
- [x] Update tests.
