# Add support for custom output filenames

## Problem
Currently, the yt-dlp web interface uses a default output filename template (`%(uploader|unknown_uploader)s/%(upload_date>%Y-%m-%d,unknown_date)s/%(title).160B [%(id)s].%(ext)s`). Users may want to specify their own custom output format for downloaded files.

## Solution
Allow users to provide a `customFilename` string in the UI. If provided, use it as the `--output` argument for yt-dlp instead of the default.

### Implementation details
1. Update `website/lib/ytdlp.ts` to accept `customFilename` and apply it to `--output` args. Add basic validation to avoid directory traversal (e.g. `..` or `/` at the beginning).
2. Update `website/lib/archive-store.ts` to save `customFilename` in the `DownloadRecord`.
3. Update `website/app/api/downloads/route.ts` to parse and validate `customFilename` from the request.
4. Update `website/components/downloader-dashboard.tsx` to add a text input for `customFilename`, submit it, handle retries, and display a `.custom-filename-badge` if a custom filename was used.
5. Update `website/app/globals.css` with the `.custom-filename-badge` styling.
6. Add unit tests and Playwright E2E tests for the new functionality.
