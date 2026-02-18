# Delete Individual Download Records

## Summary
Add the ability to delete individual download records from the history and remove their associated files from the disk.

## Requirements
- Backend:
  - Implement a function `deleteRecord(paths: DataPaths, id: string): Promise<boolean>` in `lib/archive-store.ts`.
  - The function must verify the files are within the `downloadsDir` before deleting.
  - Implement `DELETE /api/downloads/[id]` endpoint.
- Frontend:
  - Add a "Delete" button to each history item in `DownloaderDashboard`.
  - Call the API to delete the record.
  - Remove the item from the local state immediately (optimistic UI).
- Tests:
  - Unit tests for `deleteRecord`.
  - E2E tests for the deletion flow.
