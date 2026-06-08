# New Requirement: Global Notification System

## Description
Currently, operations like copy log, copy job ID, and copy URL fail silently or only log to the console if there's an error, and do not provide feedback to the user on success.

A global notification (toast) system should be implemented to provide user feedback.

## Details
- Create a reusable notification component/function in `website/src/app.js` (e.g., `showNotification(message, type)`).
- The notification should appear temporarily (e.g., 3 seconds) at the bottom or top of the screen.
- Integrate it into the various "copy" actions (`copy-logs-btn`, `copy-url-btn`, `copy-job-id-btn`).
  - Show a success message like "Copied!" on successful copy.
  - Show an error message like "Failed to copy" on error.
- Optionally add CSS styles in `website/src/styles.css` for the notification container and items.
