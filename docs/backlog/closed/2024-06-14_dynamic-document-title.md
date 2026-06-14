# Dynamic Document Title for Active Jobs

## Requirement
Update the document title in the SpotiFLAC web UI to reflect the number of active jobs (Running or Queued).
If there are 3 active jobs, the title should be `(3) SpotiFLAC`. If there are 0 active jobs, the title should be `SpotiFLAC`.

This is a high-value requirement for users who leave the web UI open in a background tab, allowing them to monitor ongoing downloads without switching tabs.

## Tasks
1. In `website/src/app.js`, within the `fetchJobs` function (or a separate update function called by it), calculate the number of active jobs (`job.status === "Running" || job.status === "Queued"`).
2. Update `document.title` accordingly.
3. Write a Playwright test in `website/tests/document-title.spec.js` to verify this behavior.
