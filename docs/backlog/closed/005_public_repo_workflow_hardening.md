# Public Repo Workflow Hardening

## Goal
Make the repository safe to switch to public visibility without breaking trusted Jules automation or owner/Jules auto-merge behavior.

## Scope
- Restrict privileged workflow behavior to trusted same-repo actors.
- Prevent privileged `workflow_run` jobs from checking out untrusted PR head code.
- Keep issue-triggered Jules sessions working for trusted actors.
- Preserve the single active Jules session limit for this repository.

## Checklist
- [x] Add shared trusted-actor/trusted-PR evaluation logic.
- [x] Harden `report-ci-failure.yml`.
- [x] Harden `manage-pr-lifecycle.yml`.
- [x] Keep `run-agent.yml` and `jules.py` aligned with trusted actor rules.
- [x] Update docs and verify with tests/lint.

## Verification
- `uv run pytest`
- `uv run ruff check automation_trust.py jules.py tests .github/scripts`
- Confirmed trusted owner-created issues still flow through `run-agent.yml` and `jules.py`.
- Confirmed single-session enforcement remains in both workflow concurrency and the Jules busy-session check.
