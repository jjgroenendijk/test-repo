# 001 - Visual Storage Progress Bar

## Summary
For self-hosted homelab deployments, keeping track of storage is critical. While the current UI displays the text "X free of Y", a visual progress bar in the storage panel provides a quick, scannable indication of capacity.

## Tasks
- Add HTML for a visual progress bar inside the `.storage-panel` in `website/src/app.js`.
- Update `updateStorageUsage` to calculate the percentage and update the UI.
- Add styling in `website/src/styles.css` matching the Apple Liquid Glass design.
