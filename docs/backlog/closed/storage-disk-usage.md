# Storage volume disk usage indicator

## Description
For a self-hosted homelab application, it is highly valuable for the user to see how much disk space is left on the mounted data volume. We will add a backend endpoint to retrieve the disk usage of `DATA_DIR` and update the frontend's storage panel to display the available disk space.

## Requirements
- Backend: GET `/api/system/storage` returning total, used, and free space in bytes.
- Frontend: Call this endpoint and display human-readable storage stats (e.g. `15 GB free of 100 GB`) in the `storage-panel`.
- Tests: Add unit tests for the endpoint in Python, and update Playwright tests if necessary.
