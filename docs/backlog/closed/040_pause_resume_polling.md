# Toggle Background Polling
Add a pause/resume button to the global UI controls to allow users to toggle the automatic background polling of job status.
When paused, background API requests for `/api/jobs`, `/api/stats`, etc. should stop.
When resumed, polling should continue.
