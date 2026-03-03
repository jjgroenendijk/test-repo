# Feature: Resolution Selection

## Description
Allow users to select a preferred maximum video resolution when downloading videos.
This provides users with better control over download size and quality.

## Requirements
- Add a dropdown for resolution selection (Best Available, 4K, QHD, FHD, HD).
- Only show the resolution dropdown when the download mode is "video".
- Update API endpoints to accept and validate the resolution parameter.
- Update yt-dlp argument builder to map the resolution to the correct format string.
- Store the selected resolution in the download history and display it as a badge.
- Include unit tests and E2E tests for the new functionality.
