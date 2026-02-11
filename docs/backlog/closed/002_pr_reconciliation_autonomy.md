# Implement Nightly PR Reconciliation + Jules Recovery

## What
Create a scheduled GitHub Action that reconciles all open PRs nightly:
- Merge PRs that are mergeable and have passing checks.
- Create or reuse an issue when a PR has merge conflicts or non-passing checks.
- Ensure a Jules session exists for that issue, and trigger one when missing.

## Why
Current automation is event-driven and can miss edge cases. A nightly reconciliation pass provides recovery and keeps autonomous development moving.

## Progress
- [x] Open backlog item for PR reconciliation automation.
- [x] Implement reconciliation script for PR merge/check/conflict/session handling.
- [x] Add nightly scheduled workflow (midnight UTC) and manual trigger.
- [x] Add unit tests for reconciliation decision logic.
- [x] Update README/docs with the new automation behavior.
- [x] Validate with local test run and prepare PR.
