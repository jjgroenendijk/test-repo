# Backlog Item: Add Feature to Export History as CSV

Since there are no open troubleshooting cases or backlog items, I need to invent a high-value requirement for the SpotiFLAC web UI, as per AGENTS.md rule 4.

## Proposed Feature: Export History as CSV

**Description:**
Add functionality to export the job history as a CSV file. The web UI currently has an "Export JSON" button, but providing a CSV option would be highly beneficial for users who want to view their job history in spreadsheet applications like Excel or Google Sheets.

**Value:**
A CSV export allows users to easily analyze their job history, filter, sort, and create reports using standard spreadsheet software, providing a homelab-friendly way to manage large amounts of download history data.

**Implementation Plan:**
1.  **Backend (`server.py`):**
    *   Add a new `GET` endpoint `/api/history/export/csv`.
    *   This endpoint will read `HISTORY_FILE`, convert the JSON data to CSV format (using Python's `csv` module and `io.StringIO`), and return a `StreamingResponse` or a `Response` with `text/csv` media type and `Content-Disposition: attachment` header.
2.  **Frontend (`website/src/app.js`):**
    *   Add a new button "Export CSV" next to the existing "Export JSON" button in the control panel.
    *   Set the `href` of the button to `/api/history/export/csv` and add the `download` attribute.
3.  **Tests:**
    *   **Backend:** Add tests for the new `/api/history/export/csv` endpoint in `tests/test_server.py`.
    *   **Frontend:** Add a Playwright test in `website/tests/export-csv.spec.js` to ensure the button is present and points to the correct URL.
