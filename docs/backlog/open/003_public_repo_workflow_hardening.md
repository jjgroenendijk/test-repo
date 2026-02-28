# Harden Public-Repo Automation Trust Boundaries

## What
Limit privileged GitHub Actions follow-up automation so it only acts on trusted same-repo pull requests while preserving the existing owner-triggered Jules issue flow and the single active-session guard.

## Why
This repository is intended to be safe to make public. Its `workflow_run` jobs currently inherit write-capable privileges from the base repository and need stricter trust checks so untrusted PR code or forked PR metadata cannot drive issue creation, PR approval, or auto-merge.

## Progress
- [x] Open backlog item for public-repo workflow hardening.
- [ ] Add shared trusted-actor and trusted-PR helper logic.
- [ ] Harden privileged `workflow_run` jobs to only process trusted same-repo PRs.
- [ ] Preserve owner-triggered Jules issue sessions and the single active-session limit.
- [ ] Add tests and update documentation.
- [ ] Validate locally, push a branch, and open a PR.
