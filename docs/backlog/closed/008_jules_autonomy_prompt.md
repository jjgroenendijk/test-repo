# 008 Jules Autonomy Prompt

## What
Make every new Jules session start with explicit autonomy rules so it finishes work without asking the user for routine confirmation or permission to continue.

## Why
Jules is stopping mid-task to ask whether it should proceed with obvious next steps like code quality checks. That stalls issue-driven automation and defeats the point of the repository's autonomous workflow.

## Progress
- [x] Open backlog item for Jules autonomy prompt hardening.
- [x] Wrap new session prompts with explicit autonomy instructions.
- [x] Disable plan approval explicitly in the session payload.
- [x] Add regression tests for the generated prompt and session payload.
- [x] Update requirements and README with the new autonomy expectation.
- [x] Verify locally and move this item to `docs/backlog/closed/`.

## Verification
- `uv run pytest`
- `uv run ruff check`
