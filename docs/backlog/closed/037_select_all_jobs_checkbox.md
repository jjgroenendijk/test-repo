# Select All Jobs Checkbox

## Background
Users can currently select multiple jobs individually to delete them. However, when there are many jobs, checking them one by one is tedious. A "Select All" option would allow users to quickly select or deselect all visible jobs.

## Requirements
- Add a "Select All" checkbox above the jobs list.
- Checking this box should select all currently visible job checkboxes.
- Unchecking this box should deselect all currently visible job checkboxes.
- Manually checking/unchecking individual jobs should update the "Select All" checkbox state (e.g., if all visible jobs are manually checked, the "Select All" checkbox should automatically check; if one is unchecked, it should uncheck).
- Selecting/deselecting all should correctly toggle the visibility of the "Delete selected" button.
- Add Playwright tests to verify the behavior.
