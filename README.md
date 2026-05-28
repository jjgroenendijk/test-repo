# Autonomous Software Development Experiment

This repository is an experiment in automated software development.
It uses Google Jules as the development agent.
It uses GitHub Actions to decide when work should run.

The goal is simple.
GitHub decides when work should happen.
Jules does the software work.
CI verifies the result.
GitHub can then merge trusted pull requests.

## First Product Goal

Jules will first keep building a web interface for `SpotiFLAC`.

The web interface should become:

- self-hosted
- container-first
- homelab-friendly
- backed by persistent `/data` storage
- useful for Spotify track, album, and playlist workflows
- safe when it calls the underlying Python module

## Unit of Work

GitHub issues are the unit of work.

Each issue describes a task.
GitHub passes that task to Jules.
Jules works from the repository context.
Jules should implement, test, document, and open a pull request.

Only owner-authored issues start Jules automatically.
Owner comments can be forwarded to an existing Jules session.
Bot comments and non-owner comments are ignored by the bridge.

## GitHub-Side Automation

These automations run in GitHub Actions.

`Run Agent` starts or resumes Jules work.
It runs on new issues, owner comments, and manual dispatch.
It calls `jules.py`.

`Scheduled Autonomous PR` runs four times a day.
It starts a fresh Jules session directly with a fixed autonomy prompt.
The prompt tells Jules to work according to `AGENTS.md` without asking questions.

`Verify Codebase` runs on pushes and pull requests.
It runs Python checks.
It also runs website linting, unit tests, Playwright tests, and the website build.

`Manage PR Lifecycle` runs after successful PR verification.
It approves and merges trusted PRs only when all checks pass.
If a merge fails, it checks for conflicts.

`Detect Merge Conflicts` runs after pushes to `main`.
It finds open PRs with conflicts.
It creates a GitHub issue for Jules when needed.

`Publish Container` runs on `main` and version tags.
It builds the repository Docker image.
It publishes the image to GitHub Container Registry.

## Jules-Side Automation

Only a small part is set up inside Jules itself.

The repository must be connected to Jules as a source.
That source gives Jules access to this GitHub repository.

The rest is passed by GitHub when it starts a session.
The bridge looks up the Jules source through the Jules API.

Sessions start from the `main` branch.
Sessions use Jules `AUTO_CREATE_PR` mode.
Plan approval is disabled.

The issue body is wrapped with autonomy instructions.
Those instructions tell Jules to work without questions.
They also tell Jules to avoid approval prompts.
When context is unclear, Jules should choose the safest local option.

Jules is responsible for the development work.
It reads the issue.
It inspects the repository.
It changes the code.
It runs relevant verification.
It updates docs when needed.
It opens a pull request.

No recurring schedule is configured inside Jules.
Scheduling lives in GitHub Actions.
Jules only runs when GitHub starts or messages a session.

## Trust Model

The repository owner is trusted by default.
Extra trusted actors can be configured with `JULES_TRUSTED_ACTORS`.

Privileged PR automation only acts on trusted PRs.
The PR must come from the same repository.
The PR head owner must match the repository owner.
The PR author must be trusted.

## Required Configuration

- `GOOGLE_JULES_API`
- `GITHUB_TOKEN`
- `JULES_TRUSTED_ACTORS` for optional extra trusted actors
