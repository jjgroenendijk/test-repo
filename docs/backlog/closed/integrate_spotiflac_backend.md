# Integrate SpotiFLAC Python backend with FastAPI

## Objective
The UI is built but doesn't actually trigger SpotiFLAC execution yet. We need to build out the backend logic to execute the `spotiflac` Python module and stream or report its progress/results back to the UI.

## Requirements
- Create FastAPI backend routes (e.g. `/api/jobs`) to accept Spotify URLs.
- Manage job state (Queued, Running, Completed, Error) in a file-backed JSON store in the `DATA_DIR` (`/data` by default).
- Execute `uv run spotiflac` using safe subprocess execution.
- Capture logs to file and serve them to the UI.
- Update frontend code to correctly display this information.
