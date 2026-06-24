# Add "Download all logs" button

## Problem
Currently, users can download all completed files using the "Download all completed" button, but there's no easy way to download the logs for all jobs.

## Solution
We should add a new feature to the web UI and backend that allows users to download all logs as a single zip archive.

1.  **Backend (`server.py`)**: Add an endpoint `GET /api/history/logs/download` that:
    *   Reads all job logs from the `LOGS_DIR`.
    *   Creates a ZIP archive in memory containing all `.log` files.
    *   Returns the ZIP file as an attachment.
2.  **Frontend (`website/src/app.js`, `website/src/index.html`)**:
    *   Verify the existence of the button with ID `download-all-logs-btn` and href `/api/history/logs/download` in `index.html`. If not present, add it alongside the "Download all completed" button.
    *   Update `app.js` to show/hide this button based on whether there are any jobs with logs (or just if there are any jobs). Let's make it visible if there's any job in the history, similar to how we show other bulk buttons. Let's just follow the existing logic where `download-all-logs-btn` is defined in `website/src/app.js`.

Wait, let me double check the frontend. The `grep` output showed:
`src/app.js:            <a href="/api/history/logs/download" id="download-all-logs-btn" class="clear-history-btn download-link" download>Download all logs</a>`

So the button is already in `app.js` logic and in the HTML, but wait, is the backend endpoint implemented?
Let's check `server.py` for `/api/history/logs/download`.
