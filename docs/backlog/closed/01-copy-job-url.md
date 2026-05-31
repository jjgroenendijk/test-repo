# Copy Job URL Button

## Context
In the web UI, job cards show the Spotify URL. It would be helpful to have a button to easily copy the URL to the clipboard.

## Requirements
- Render a "Copy" button next to the URL in the `.job-title` element.
- When clicked, it should use the `navigator.clipboard.writeText` API to copy the URL.
- Show a brief "Copied!" feedback text on the button when successful, then revert back to "Copy" after 2 seconds.
- Update tests.
