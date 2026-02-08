# Jules Requirements

## Overview
This repository integrates **Google Jules** via its REST API and hosts a web interface that makes `yt-dlp` easier to use for downloading and archiving online videos.

## Architecture

### 1. Jules Bridge (GitHub Actions)
- A GitHub Action workflow acts as the bridge.
- It listens for GitHub issue events.
- It executes `jules.py` to process the event and call the Jules API.

### 2. Google Jules API Integration
- **Authentication:** Uses `GOOGLE_JULES_API` key stored in repository secrets.
- **Source Resolution:** Maps `owner/repo` to Jules Source ID.
- **Session Creation:** New issues create Jules sessions with `AUTO_CREATE_PR`.

### 3. Web Downloader Interface
- Users submit one or more video URLs via a web UI.
- The app runs `yt-dlp` server-side with safe argument construction.
- Downloads are archived with `--download-archive` and persisted metadata.
- Users can inspect previous runs and downloaded files from the same interface.

### 4. Containerized Deployment
- The full system is shipped as a **single container image**.
- The container includes Node.js app runtime, `yt-dlp`, and `ffmpeg`.
- Persistent media/archive data is stored in a mounted `/data` volume.

## Setup Requirements
- **Environment Variables:**
  - `GITHUB_TOKEN`: For GitHub issue comments in workflows.
  - `GOOGLE_JULES_API`: API key for Jules.
  - `DATA_DIR` (optional): Path for downloads/archive data (defaults to `/data`).
- **Dependencies:**
  - Python 3 + `uv` for Jules bridge/testing.
  - Node.js for website development.
  - Docker for container build/publish.

## Product Requirements
- Keep the codebase focused on the yt-dlp archive product scope.
- Provide a web UI focused on `yt-dlp` download/archive workflows.
- Include unit tests and Playwright tests for key user flows.
- CI must verify Python + website quality gates.
- CI/CD must publish one runnable container image.
