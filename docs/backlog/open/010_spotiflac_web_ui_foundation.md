# 010 SpotiFLAC web UI foundation

## Goal
Use Google Jules to build the first real product slice for a self-hosted homelab web UI around the Python module `SpotiFLAC`.

## Desired first slice
- Accept Spotify track, album, or playlist URLs.
- Trigger safe server-side execution of the Python `SpotiFLAC` module.
- Persist job history in `/data`.
- Show job status, logs, and produced files in the web UI.
- Keep deployment as one container image.

## Constraints
- Keep existing Jules bridge, queueing, trust model, and scheduled autonomous tasks.
- Build from the current clean-slate reset state.
- Keep new work testable with unit tests and Playwright tests.

## Suggested research inputs for Jules
- SpotiFLAC Python module parameters: `url`, `output_dir`, `services`, `filename_format`, `use_track_numbers`, `use_artist_subfolders`, `use_album_subfolders`, `loop`.
- Homelab deployment needs: mounted storage, simple env vars, safe job execution, resumable history.

## Status
- [x] Container-ready web UI shell added.
- [x] URL entry workflow represented in the UI.
- [x] Unit and Playwright tests added for the UI foundation.
- [x] Container build updated to publish the web UI.
- [ ] Server-side SpotiFLAC runtime integration not started.
- [ ] Persistent `/data` job history not started.
- [ ] Real job status, logs, and produced files not started.

## Verification
- `uv run pytest`
- `cd website && npm run lint && npm run test && npm run test:e2e && npm run build`
