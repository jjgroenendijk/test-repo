# Troubleshooting Jules Session Spawning

**Date:** 2026-01-23
**Issue:** GitHub issues, PR merge conflicts, and PR CI check failures do not spawn new Jules sessions.

## Initial Analysis
- `jules.py` handles `opened` issues and `workflow_dispatch` (simulating `opened`).
- `run-agent.yml` invokes `jules.py`.
- Other workflows (`detect-merge-conflicts.yml`, `report-ci-failure.yml`) are supposed to trigger `run-agent.yml`.
- `GITHUB_TOKEN` limitations are bypassed by using `workflow_dispatch` in automated workflows.
- Manual issues should trigger `run-agent.yml` automatically.

## Investigation Steps
1. Verified `run-agent.yml` configuration.
2. Verified `detect-merge-conflicts.yml` triggers `run-agent.yml` correctly.
3. Verified `report-ci-failure.yml` triggers `run-agent.yml` correctly.
4. Checked `jules.py` logic for handling these triggers.

## Hypotheses
1. **API Payload/Endpoint Issue:** The `create_session` payload or endpoint might be incorrect for `jules.googleapis.com/v1alpha`.
2. **Authentication:** `GOOGLE_JULES_API` key might be invalid or missing permissions.
3. **Workflow Failure:** `run-agent.yml` might be failing during setup (e.g. `uv` installation) or execution.
4. **Input Handling:** The `issue_number` input passing might be fragile.

## Findings from API Discovery
Using the discovery document `https://jules.googleapis.com/$discovery/rest?version=v1alpha`, we found:
- **`create_session`**: Endpoint `POST v1alpha/sessions` is correct. The payload structure in `jules.py` (including `sourceContext`, `automationMode`, `title`, `prompt`) aligns with the `Session` resource definition.
- **`send_message`**: The code was using `POST v1alpha/{session_id}/messages` with `{"content": "..."}`. The discovery document reveals the correct method is `POST v1alpha/{session_id}:sendMessage` (custom verb) and the request body should be `{"prompt": "..."}`.
- **Session Verification**: `jules.py` was not verifying if the session was successfully persisted after creation.

## Resolution
1. **Fixed `send_message`**: Updated to use the correct endpoint (`:sendMessage`) and payload (`prompt` key).
2. **Added Verification**: `create_session` now calls `get_session` immediately after creation to ensure the session exists and is accessible.
3. **Enhanced Logging**: Added logic to capture and print `response.text` when API calls fail. This will allow detailed error messages from the API to be visible in the GitHub Action logs and posted as comments on the issue.

## Next Steps
- Monitor the next triggered session. If it fails, the new error logging will provide the exact cause (e.g., specific validation error on `automationMode` or `startingBranch`).
