# Video Resolution Limit

## Description
Add a feature to allow users to select a maximum resolution for video downloads (e.g., 1080p, 720p).

## Motivation
- Users may want to save disk space or bandwidth.
- Some devices may not play back 4K or 8K content smoothly.

## Requirements
- Add a "Resolution" dropdown to the download form (only visible for "Video" mode).
- Options: "Best" (default), "4K", "1080p", "720p", "480p".
- Backend should map these to `yt-dlp` format strings:
  - Best: (default behavior)
  - 4K: `bestvideo[height<=2160]+bestaudio/best[height<=2160]`
  - 1080p: `bestvideo[height<=1080]+bestaudio/best[height<=1080]`
  - 720p: `bestvideo[height<=720]+bestaudio/best[height<=720]`
  - 480p: `bestvideo[height<=480]+bestaudio/best[height<=480]`
- Persist the chosen resolution in the download history.
- Support "Retry" with the original resolution setting.
