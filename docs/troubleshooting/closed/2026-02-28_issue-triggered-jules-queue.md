# Troubleshooting Issue-Triggered Jules Queue

**Date:** 2026-02-28
**Issue:** Newly created GitHub issues no longer always start Jules automatically, and the repo needs a single-session guard.

## Investigation
- Checked recent `Run Agent` workflow history.
- Compared `issues` runs with bot-created issue history in GitHub.
- Reviewed `jules.py`, `run-agent.yml`, and `.github/scripts/reconcile_prs.py`.

## Findings
- Bot-created issues from GitHub Actions do not recursively trigger `issues.opened` workflows when they are created with `GITHUB_TOKEN`.
- `.github/scripts/reconcile_prs.py` created new issues but intentionally skipped the explicit `run-agent.yml` dispatch, assuming the issue-open event would handle it.
- The Jules bridge had no repository-level active-session check, so multiple near-simultaneous issue triggers could create multiple Jules sessions for the same repo.

## Fix Plan
- Add repo-level workflow concurrency plus a Jules API busy-session check in `jules.py`.
- Queue issues instead of starting a second session when Jules is already active for this repo.
- Add an automatic retry path so queued issues are retried until capacity is available.
- Make PR reconciliation explicitly dispatch Jules after creating a new issue.

## Verification
- `uv run pytest`
- `uv run ruff check jules.py tests .github/scripts/reconcile_prs.py`
- Confirmed from GitHub history that recent issue-trigger gaps aligned with the reconciliation path creating issues without dispatching `run-agent.yml`.
