# 011 Jules no-user-validation autonomy hardening

## Goal
Make the generated Jules session prompt explicit that Jules must never ask the user for validation, clarification, approval, or questions under any circumstance.

## Why
Jules can still pause for user validation despite the existing autonomy prompt. The bridge prompt should force a best-effort local decision when context is ambiguous.

## Status
- [x] Open backlog item for the prompt hardening.
- [x] Update the generated Jules autonomy prompt.
- [x] Add regression coverage for no-user-validation wording.
- [x] Update workflow documentation.
- [x] Verify locally and move this item to `docs/backlog/closed/`.

## Verification
- `uv run pytest tests/test_jules_session.py tests/test_jules_bridge.py`
- `uv run ruff check`
- `uv run pytest`
