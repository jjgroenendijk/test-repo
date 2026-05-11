# 001: Job Refresh Button

## Requirement
Add a "Refresh jobs" button to the SpotiFLAC web UI to allow users to manually refresh the job list.

## Details
- Place the "Refresh jobs" button next to the "Download all completed" and "Clear history" buttons in the "Recent jobs" section.
- The button should trigger the `fetchJobs()` function when clicked.
- Style the button consistently with the other buttons in that row (using the `.clear-history-btn` class).
- It will give users an immediate way to check status without waiting for the 5-second polling interval.