# Backlog Item: Autofocus Spotify URL input field

## Description
When the user opens the SpotiFLAC web UI, the Spotify URL input field should be automatically focused so they can immediately paste a URL and hit Enter without having to click the input field first.

## Requirements
- Add the `autofocus` attribute to the textarea with id `spotify-url` in `website/src/app.js`.
- Add a Playwright test to verify that the element is focused upon page load.
