# Delete Individual Download Record

## What
Allow users to delete a specific download record from the history. This should also delete the associated files from the disk.

## Why
Users may want to remove failed attempts or free up space by deleting specific large downloads without clearing the entire history. This provides more granular control over storage usage.

## Acceptance Criteria
- [x] A "Delete" button appears on each history item in the dashboard.
- [x] Clicking the "Delete" button removes the item from the history list.
- [x] Clicking the "Delete" button deletes the associated files from the `downloads` directory.
- [x] The total storage usage updates after deletion.
