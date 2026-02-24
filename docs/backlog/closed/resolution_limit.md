# Resolution Limit

## Description
Add a feature to allow users to select a maximum resolution for video downloads. Currently, downloads default to "Best Video + Audio". This can result in very large files (e.g., 4K/8K) that consume excessive disk space.

## Requirements
- Add a dropdown to the `DownloaderDashboard` component.
- Options: "Best Available" (default), "4K (2160p)", "QHD (1440p)", "FHD (1080p)", "HD (720p)".
- Pass the selected resolution to the backend API.
- Update `yt-dlp` arguments construction to respect the resolution limit.
- Persist the chosen resolution in the download history.

## Acceptance Criteria
- User can select a resolution from the dropdown.
- The selected resolution is sent to the backend.
- `yt-dlp` runs with the appropriate format selection (e.g., `bestvideo[height<=1080]+bestaudio/best[height<=1080]`).
- Download history shows the selected resolution.
