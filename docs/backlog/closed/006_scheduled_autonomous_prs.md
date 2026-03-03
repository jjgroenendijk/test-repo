# 006 Scheduled Autonomous PR Creation

## What
Add a GitHub-managed schedule that creates or reuses an issue-backed Jules run so autonomous work still goes through `AUTO_CREATE_PR`.

## Why
Scheduled tasks created inside Jules do not reliably post pull requests for this repository. The repo already knows how to create Jules sessions from GitHub issues, so the scheduler should trigger that path instead of relying on Jules-native scheduling.

## Progress
- [x] Open backlog item for scheduled autonomous PR creation.
- [x] Implement a scheduler script that reuses a canonical automation issue and triggers `run-agent.yml`.
- [x] Add a scheduled workflow with overlap guards so only one autonomous run is active at a time.
- [x] Add unit tests for the scheduler behavior.
- [x] Update requirements and README with the GitHub-managed scheduling model.
- [x] Verify locally and move this item to `docs/backlog/closed/`.

## Verification
- `uv run pytest tests/test_schedule_autonomous_pr.py`
- `uv run pytest tests/test_reconcile_prs.py`
