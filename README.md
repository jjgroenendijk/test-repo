# Google Jules + YT-DLP Web Archive

This repository is configured for **Google Jules** autonomous development and includes a web interface for downloading and archiving online videos with `yt-dlp`.

## What this repo provides

- A GitHub Actions + `jules.py` bridge that starts Jules sessions from GitHub Issues.
- A Next.js web UI to submit download jobs and review archived history.
- Server-side `yt-dlp` execution with persisted archive metadata.
- A single container build for deployment.

## Jules workflow

Open a new GitHub issue with the task you want Jules to perform.

The automation will:

1. Read the issue.
2. Resolve this repository as a Jules source.
3. Start a Jules session.
4. Comment back with the session ID.

Required secrets:

- `GOOGLE_JULES_API`
- `GITHUB_TOKEN` (provided by GitHub Actions)

## Local development

### Python bridge

```bash
uv sync --all-groups
uv run pytest
```

### Web interface

```bash
cd website
npm ci
npm run dev
```

Open `http://localhost:3000`.

Useful env vars:

- `DATA_DIR`: storage location for downloads/history (default `.data` in dev, `/data` in production).
- `YT_DLP_BIN`: override path/name for `yt-dlp` binary.

## Run in one container

Build and run:

```bash
docker build -t jules-yt-dlp .
docker run --rm -p 3000:3000 -v $(pwd)/data:/data jules-yt-dlp
```

The app will be available on `http://localhost:3000`.

## CI/CD

- `Verify Codebase` runs Python lint/tests and website lint/unit/e2e tests.
- `Publish Container` builds and publishes the single runtime image to GHCR.
