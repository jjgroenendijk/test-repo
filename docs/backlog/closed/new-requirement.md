# New Requirement: Expand Spotify Validation to Include Shows and Episodes

## Motivation
Currently, SpotiFLAC's frontend URL validation only accepts `track`, `album`, `playlist`, and `artist` endpoints from `open.spotify.com`. Spotify also hosts podcasts (shows and episodes) that users might want to process. By relaxing the validation to include `show` and `episode`, we open up the UI to a broader range of Spotify content, making the tool more versatile for users who want to manage a wider array of audio files.

## Acceptance Criteria
- [x] The `isSpotifyUrl` function in `website/src/app.js` is updated to include `show` and `episode` in its list of valid URL parts.
- [x] Tests in `website/src/app.test.js` are updated to cover `show` and `episode` URL validation cases.
- [x] All tests pass.
- [x] The change is committed and this backlog item is moved to `docs/backlog/closed/`.
