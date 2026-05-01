# Jules Requirements

## Overview
This repository integrates **Google Jules** via its REST API and is being repurposed to build a self-hosted web UI for the Python module `SpotiFLAC`.

Current state:
- Jules automation stays active.
- Legacy yt-dlp product code is removed.
- SpotiFLAC product implementation starts from a clean slate.

## Architecture

### 1. Jules Bridge (GitHub Actions)
- A GitHub Action workflow acts as the bridge.
- It listens for GitHub issue events.
- It executes `jules.py` to process the event and call the Jules API.
- Public issue/comment entry stays gated to the dynamic repository owner.
- Scheduled autonomous development must also enter through GitHub-managed workflows so sessions stay issue-backed and PR-capable.

### 2. Google Jules API Integration
- **Authentication:** Uses `GOOGLE_JULES_API` key stored in repository secrets.
- **Source Resolution:** Maps `owner/repo` to Jules Source ID.
- **Session Creation:** New issues create Jules sessions with `AUTO_CREATE_PR`.
- **Single Active Session:** Only one non-terminal Jules session may be active for this repository at a time.
- **Queued Retry:** When a new issue arrives while Jules is busy, the issue is queued and retried automatically until it starts.
- **Owner-Gated Issue Entry:** Public issue/comment events only start or steer Jules when they come from the repository owner.
- **Autonomous Session Prompting:** New Jules sessions must be instructed to continue autonomously under all circumstances, without asking the user for validation, clarification, plan approval, permission to continue, or feedback. When context is ambiguous, Jules must choose the best option from repository context, continue, and document the assumption in its summary.
- **Trusted PR Automation:** Privileged PR follow-up automation only acts on trusted same-repo PRs.
- **Configurable Trusted Actors:** The repository owner is trusted by default, and optional extra logins may be provided through `JULES_TRUSTED_ACTORS`.
- **Scheduled Recovery:** Recurring autonomous runs must reuse the same issue-backed flow instead of relying on Jules-native scheduling.
- **Transient Check Handling:** PR reconciliation must wait for non-terminal check states instead of treating them as Jules blockers.

### 3. SpotiFLAC Web UI Product Direction
- The product target is a browser-based UI for the Python module `SpotiFLAC`.
- The UI is meant for people self-hosting the app in a single container in a homelab.
- The UI must focus on music-library workflows around Spotify track, album, and playlist URLs.
- The backend must orchestrate the Python `SpotiFLAC` module, not `yt-dlp`.
- The product should support homelab-friendly storage paths, persistent history, and safe server-side job execution.
- Product-specific implementation details remain unsatisfied until new backlog items are completed.

### 4. Containerized Deployment
- The full system is shipped as a **single container image**.
- The container must include the runtimes and dependencies needed for the website and Python integration.
- Persistent media/application data must be stored in a mounted `/data` volume.

## Setup Requirements
- **Environment Variables:**
  - `GITHUB_TOKEN`: For GitHub issue comments in workflows.
  - `GOOGLE_JULES_API`: API key for Jules.
  - `DATA_DIR` (optional): Path for persistent application data. Defaults to `/data` in production.
- **Dependencies:**
  - Python 3 + `uv` for Jules bridge/testing.
  - Node.js for website development.
  - Docker for container build/publish.

## Product Requirements
- Keep the codebase focused on the SpotiFLAC web UI product scope.
- Do not reintroduce yt-dlp product code or yt-dlp backlog items.
- Keep Google Jules integration, issue-backed autonomy, queueing, trusted PR automation, and scheduled autonomous development intact.
- Build the web UI specifically for self-hosted homelab deployment.
- Include unit tests and Playwright tests for new user-facing features when implementation begins.
- CI must verify Python + website quality gates.
- CI/CD must publish one runnable container image.
