# Inline Audio Playback

## Description
The SpotiFLAC web UI allows users to download audio files. Currently, users can download the files via a link, but there is no way to preview or play the audio directly in the browser.

## Requirements
- Add an inline audio player (`<audio controls>`) for audio files in the downloaded files list.
- Supported extensions: `.flac`, `.mp3`, `.wav`, `.m4a`, `.ogg`.
- The audio source should point to the correct file download API endpoint.
- Include Playwright tests to verify the player is rendered correctly when an audio file is present in the job output.
