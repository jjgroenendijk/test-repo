# Download Cover Art Button

The web UI currently shows the cover art of the job but does not provide a direct way to download the full resolution image natively.

Requirement:
Add a download button or link directly on the track cover image in the job card that triggers a native file download of the cover art from the `/api/jobs/{id}/cover` endpoint. The implementation must not require backend `Content-Disposition: attachment` modifications, and instead rely on frontend native features like `<a>` tags with the `download` attribute as outlined in system memory.
