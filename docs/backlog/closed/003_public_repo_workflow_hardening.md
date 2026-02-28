# Harden Public-Repo Automation Trust Boundaries

**Date:** 2026-02-28

## What
Limit privileged GitHub Actions follow-up automation so it only acts on trusted same-repo pull requests while preserving the existing owner-triggered Jules issue flow and the single active-session guard.

## Why
This repository is intended to be safe to make public. Its `workflow_run` jobs currently inherit write-capable privileges from the base repository and need stricter trust checks so untrusted PR code or forked PR metadata cannot drive issue creation, PR approval, or auto-merge.

## Progress
- [x] Open backlog item for public-repo workflow hardening.
- [x] Add shared trusted-actor and trusted-PR helper logic.
- [x] Harden privileged `workflow_run` jobs to only process trusted same-repo PRs.
- [x] Preserve owner-triggered Jules issue sessions and the single active-session limit.
- [x] Add tests and update documentation.
- [x] Validate locally, push a branch, and open a PR.

## Verification
- `uv run pytest`
- `uv run ruff check automation_trust.py jules.py tests .github/scripts`
- Branch pushed: `codex/harden-public-repo-automation`
- PR opened: `#200`
