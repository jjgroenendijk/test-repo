# Visual Progress Bar

The SpotiFLAC web UI currently shows download progress for running jobs as simple text (e.g., `[1/10] (10%)`).
To improve the user experience and fit the "Apple Liquid Glass" aesthetic, this text progress should be accompanied by a visual progress bar.

## Requirements
- Add a visual progress bar element inside the `.job-progress` container.
- The progress bar should have a background track (`.progress-bar-bg`) and a filled area (`.progress-bar-fill`) that updates its width according to the percentage returned by the `/api/jobs/{id}/progress` endpoint.
- Style the progress bar to fit the existing glassmorphism design system (translucency, blur, appropriate borders and colors).
- Ensure existing text progress indicators are still visible.
- Add Playwright tests to verify the progress bar is rendered and updates its width properly.
