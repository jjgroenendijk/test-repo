# Download All Completed Jobs Feature

## Problem
Currently, the UI has a "Download all completed" button and the UI makes a request to `/api/history/download`. However, there are no tests for this backend endpoint to ensure it correctly packages all completed jobs into a single ZIP archive.

## Requirements
1. Add backend tests to `tests/test_server.py` to cover the `/api/history/download` endpoint.
2. The tests should cover successful download of multiple completed jobs.
3. The tests should cover the case where there are no completed jobs (should return 404).

## Technical Details
- Endpoint: `/api/history/download`
- Test file: `tests/test_server.py`
