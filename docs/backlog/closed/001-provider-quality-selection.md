# Add Audio Provider Service and Quality selection to the SpotiFLAC web UI

## Requirement
The SpotiFLAC web UI needs to support native `spotiflac` options for downloading music:
1. **Audio Provider (`--service`)**: The backend should allow users to specify the download service like tidal, qobuz, deezer, amazon, spoti, soundcloud, youtube, apple, pandora.
2. **Quality Levels (`--quality`)**: The quality selection in the frontend should use native quality values like `LOSSLESS`, `HI_RES_LOSSLESS`, `HIGH`, `LOW` rather than kbps mappings.

## Implementation details
- Update `website/src/app.js` to replace the `128kbps`/`256kbps`/`320kbps` selector with standard quality names supported by spotiflac.
- Add a new `<select>` input in `website/src/app.js` for `service`.
- Pass `service` and `quality` via the `/api/jobs` endpoint.
- Update `server.py` to parse `service` and `quality` and pass them as flags to the `spotiflac` CLI invocation.
