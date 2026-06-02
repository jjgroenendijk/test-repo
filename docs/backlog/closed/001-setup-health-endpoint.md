# Setup health endpoint

## Context
As part of the SpotiFLAC web UI product direction (requirement 3), we need a backend to orchestrate the `SpotiFLAC` Python module and serve the web UI.

## Requirements
1. Add an API endpoint for health checking (`/api/health`) to `server.py` that returns `{"status": "ok"}`.
2. Add test for the backend health checking endpoint to `tests/test_server.py`.
