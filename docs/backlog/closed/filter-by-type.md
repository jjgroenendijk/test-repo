# Filter Jobs by Type

## Problem
Users may want to easily find all playlists or albums they've downloaded without seeing individual tracks, but currently they can only filter by status or search by text.

## Solution
Add a "Type" filter dropdown next to the existing "Status" filter.
1. The dropdown should have options: "All Types", "Track", "Album", "Playlist".
2. The UI should filter the displayed jobs based on their URL type using the existing `classifySpotifyUrl` logic.
3. Update Playwright tests to ensure filtering by type works.
