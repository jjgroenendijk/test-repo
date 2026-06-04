# Requirement: Copy Logs to Clipboard

- **Goal**: Allow users to easily copy the contents of the execution logs for a job to their clipboard.
- **Details**:
  - Add a "Copy Logs" button in the log container header next to "Refresh Logs".
  - When clicked, the button should read the content from the log display block and use the `navigator.clipboard` API to copy it.
  - Temporarily change the button text to "Copied!" for 2 seconds to provide feedback.
