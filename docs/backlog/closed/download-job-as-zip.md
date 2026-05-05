# Download Job as ZIP Archive

## Requirement
Users self-hosting the app may want to easily download the completed tracks from a specific job directly through their browser, rather than having to access the `/data` volume over the network (e.g., via SMB/NFS or Docker volume mounts).

Adding a backend endpoint to compress and stream a job's output directory as a ZIP archive, along with a UI button to trigger the download, will significantly improve the user experience for homelab users.

## Tasks
1. Add a backend endpoint `GET /api/jobs/{job_id}/download` that creates a ZIP archive of the job's output directory and returns it as a `FileResponse` or streaming response.
2. Update the frontend job card UI to display a "Download ZIP" button for jobs in the "Completed" state.
3. Write/update unit tests for the backend endpoint and Playwright tests for the frontend UI.
