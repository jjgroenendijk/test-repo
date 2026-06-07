# Support Spotify Artist URLs

## Description
Currently, the SpotiFLAC web interface only accepts Spotify track, album, and playlist URLs. We should expand this functionality to also support Spotify artist URLs so users can queue up an entire artist's discography for download.

## Requirements
- Update URL validation logic in the frontend (`isSpotifyUrl` in `app.js`) to allow URLs containing `/artist/`.
- Update placeholder text and queue feedback messages in the UI to mention "artists".
- Add an "Artist" option to the job type filter dropdown so users can filter jobs by artist URLs.
- Add Playwright UI tests to verify that an artist URL can be successfully queued and that the new filter option works.
