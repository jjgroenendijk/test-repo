# Jules Requirements

## Overview
This repository integrates **Google Jules** via its REST API. The goal is to allow users to interact with the Jules AI agent directly through GitHub Issues.

## Architecture

### 1. The Bridge (GitHub Actions)
*   A GitHub Action workflow acts as the bridge.
*   It listens for GitHub events (specifically `issues: opened`).
*   It executes a Python script (`jules.py`) to process the event and call the Jules API.

### 2. Google Jules API Integration
*   **Authentication:** Uses `GOOGLE_JULES_API` key (stored in Repo Secrets).
*   **Source Resolution:** The script automatically maps the current GitHub repository (`owner/repo`) to the corresponding Jules Source ID.
*   **Session Creation:** New GitHub issues trigger the creation of a new **Jules Session**. The issue body is passed as the prompt.

### 3. User Interaction
*   **Input:** User creates an issue with a description of the task.
*   **Feedback:** The system posts a comment on the issue confirming that a Jules Session has been started, including the Session ID.

### 4. Automated Failure Reporting
*   **Trigger:** When a CI check fails on a Pull Request.
*   **Action:** A new GitHub Issue is automatically created.
*   **Content:** The issue contains:
    *   The PR number.
    *   A snippet of the log failure (10 lines before/after the error).
    *   A link to the full logs.

## Setup Requirements
*   **Environment Variables:**
    *   `GITHUB_TOKEN`: For interacting with the GitHub Issue (posting comments).
    *   `GOOGLE_JULES_API`: The API key for Google Jules.
*   **Dependencies:**
    *   `gh` CLI (installed via `setup.sh`).
    *   Python 3 with `uv` for package management.

## Future Scope
*   Two-way sync: Forwarding comments from GitHub to the Jules Session.
*   Polling: Automatically updating the GitHub issue when Jules completes the task or opens a PR.

## Game Requirements
*   **Static Website:** The game must be designed to work as a static website.
*   **Deployment:** Must be hosted on GitHub Pages.
*   **CI/CD:** Automated testing and publishing to GitHub Pages via GitHub Actions is required.
*   **Procedural Generation:** The world has to be generated algorithmically, and the terrain has to look interesting.
