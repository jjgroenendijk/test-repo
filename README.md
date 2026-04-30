# SpotiFLAC Web UI

This repository keeps the **Google Jules** autonomous development bridge and builds toward a self-hosted web UI for the Python module `SpotiFLAC`.

## What stays

- GitHub Actions + `jules.py` issue bridge for Google Jules
- Issue-backed autonomous work with queued retry
- Trusted PR automation and reconciliation
- Single-container deployment target

## What changed

- Legacy yt-dlp product direction removed
- Legacy yt-dlp website implementation removed
- Repository now targets a homelab-friendly SpotiFLAC web UI container
- Website contains the first container-ready SpotiFLAC UI foundation

## Jules workflow

Open a new GitHub issue with the task you want Jules to perform.
By default, only issues opened by the repository owner automatically start or queue a Jules session.

The automation will:

1. Read the issue.
2. Resolve this repository as a Jules source.
3. Start a Jules session immediately when the repo has no active Jules work.
4. Queue the issue automatically when another Jules session for this repo is still running.
5. Wrap the issue body with autonomy instructions so Jules never asks questions and keeps working through implementation and verification with safe local assumptions.
6. Comment back with the session ID once the issue starts.

Issue-triggered Jules entry stays owner-only even if you configure extra trusted PR actors.

For recurring autonomous work, use the repository workflow in `.github/workflows/scheduled-autonomous-pr.yml`, not a schedule configured inside Jules. The workflow reuses a canonical GitHub issue and dispatches `run-agent.yml`, which keeps the session on the `AUTO_CREATE_PR` path this repository already reconciles.

## Trusted automation model

Privileged `workflow_run` follow-up automation only acts on trusted pull requests:

- The PR must come from the same repository, not a fork.
- The PR head repository owner must match the current repository owner.
- The PR author must be trusted.

Trusted actors are resolved dynamically:

- The current repository owner is always trusted by default.
- You can optionally add more trusted GitHub logins with the repository variable `JULES_TRUSTED_ACTORS`.
- `JULES_TRUSTED_ACTORS` accepts either a JSON array or a comma-/whitespace-separated list of logins.

This trust model is used for privileged PR follow-up like CI failure issue creation and auto-merge. The Jules issue bridge itself remains gated to owner-authored issues and owner comments, and the repository still enforces a single active Jules session at a time.

Required secrets:

- `GOOGLE_JULES_API`
- `GITHUB_TOKEN` (provided by GitHub Actions)

Optional repository variable:

- `JULES_TRUSTED_ACTORS`: extra trusted logins for privileged PR follow-up automation, for example `[`"app/google-jules"`]` or `app/google-jules teammate`

## Product target

Jules will rebuild the product around these goals:

- self-hosted web UI for `SpotiFLAC`
- single container image for homelab deployment
- persistent `/data` volume
- music-library workflows for Spotify tracks, albums, and playlists
- safe Python module orchestration from the web backend

## Local development

### Python bridge

```bash
uv sync --all-groups
uv run pytest
```

### Website placeholder

```bash
cd website
npm ci
npm run dev
```

Open `http://localhost:3000`.

Useful env vars:

- `DATA_DIR`: storage location for persistent app data in future product work

## Run in one container

Build and run:

```bash
docker build -t jules-spotiflac-reset .
docker run --rm -p 3000:3000 -v $(pwd)/data:/data jules-spotiflac-reset
```

The web UI will be available on `http://localhost:3000`.

## CI/CD

- `Verify Codebase` runs Python lint/tests and website quality checks.
- `Scheduled Autonomous PR` runs daily to create or reuse the canonical autonomous-development issue and trigger an issue-backed Jules session when the repo is idle.
- `Run Agent` reacts to new issues/comments and also polls hourly to drain queued issues when the repo's active Jules session finishes.
- `PR Reconciliation` runs hourly to merge healthy open PRs, wait on non-terminal CI states, retry queued Jules automation issues, deduplicate stale automation tickets, recover missing Jules sessions, and close linked automation issues after successful merges.
- `Manage PR Lifecycle` closes linked merge/conflict automation issues immediately after an automated merge succeeds.
- `Close PR Automation Issues` runs on merged PR close events to close linked automation issues for manual merges.
- `Publish Container` builds and publishes the single runtime image to GHCR.
