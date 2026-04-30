# 007 Ignore Transient PR Check States

## What
Prevent PR reconciliation from treating transient CI states like `QUEUED` as blockers that spawn automation issues and Jules sessions.

## Why
Queued or in-progress checks are not failures. Treating them as blockers causes unnecessary automation issues and can start Jules sessions while CI is still legitimately running.

## Progress
- [x] Open backlog item for transient PR check handling.
- [x] Update PR reconciliation to wait on transient check states.
- [x] Add regression tests for queued and in-progress checks.
- [x] Update relevant docs.
- [x] Verify locally and move this item to `docs/backlog/closed/`.

## Verification
- `uv run pytest tests/test_reconcile_prs.py`
