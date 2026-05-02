# Real-time Download Status Indicator

## Requirement
The UI currently polls the backend for job status every 5 seconds. The user should be able to see the progress of the download.
The SpotiFLAC CLI output or some form of progress should be parsed from the job logs and displayed alongside the "Running" status in the UI to give users confidence that the job is progressing, especially for large playlists.

## Tasks
- Add a new endpoint to fetch only the tail of the log or progress stats, OR modify the existing log endpoint to handle partial reads/stream if needed, or simply parse the log fetched on demand.
- The UI should poll for logs while a job is in the "Running" state to extract the percentage or currently downloading track from the log.
- Update the job card UI to display a subtle progress indicator or "Currently downloading: <track name>" based on log parsing.
