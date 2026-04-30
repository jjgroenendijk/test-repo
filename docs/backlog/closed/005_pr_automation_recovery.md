# 005 Recover Queued Jules Automation Issues

## What
Improve PR automation recovery so Jules-created CI failure and merge-conflict issues do not remain open indefinitely when Jules is busy or when duplicate automation issues are created.

## Why
The repository already creates automation issues for blocked PRs, but recovery is too weak. Queued issues can sit open for too long, and duplicate automation issues accumulate for the same PR.

## Progress
- [x] Open backlog item for automation recovery and deduplication.
- [x] Extend PR reconciliation to recover queued automation issues.
- [x] Close duplicate automation issues for the same PR.
- [x] Increase reconciliation cadence so queued work is retried promptly.
- [x] Add unit tests for queued issue recovery and duplicate cleanup.
- [x] Update README documentation for the recovery behavior.
