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

## Resolution (First Attempt)
1. **Fixed `send_message`**: Updated to use the correct endpoint (`:sendMessage`) and payload (`prompt` key).
2. **Added Verification**: `create_session` now calls `get_session` immediately after creation to ensure the session exists and is accessible.
3. **Enhanced Logging**: Added logic to capture and print `response.text` when API calls fail. This will allow detailed error messages from the API to be visible in the GitHub Action logs and posted as comments on the issue.

## Ongoing Issue (2026-01-23 Update)
Despite the above fixes, new sessions are still not being spawned.

### New Hypotheses
1. **Hardcoded Branch Name**: `jules.py` hardcodes `startingBranch` to `main`. If a repository uses a different default branch (e.g., `master`), the API call might fail.
2. **Silent Failures**: If the `gh` command (used to post error comments) fails (e.g., due to permission issues or command not found), the script exits with an error code, but no comment is visible on the issue.
3. **Dependency Issues**: The `uv` version in `run-agent.yml` is not pinned, which might lead to inconsistencies compared to `verify-codebase.yml`.
4. **API Pagination**: The `list_sources` method might be failing to find the repository if it's not on the first page of results.

### Proposed Actions
1. **Dynamic Branch Detection**: Update `jules.py` to dynamically fetch the default branch using `gh repo view`.
2. **Robust Error Handling**: Wrap `gh` commands in try-except blocks and ensure all failures are logged to stdout/stderr.
3. **Environment Stability**: Pin `uv` version in `run-agent.yml`.
4. **Debug Logging**: Add `gh auth status` to the workflow to verify permissions.
5. **Pagination Support**: Update `list_sources` to handle `nextPageToken`.

## Findings from Second Investigation
- **API Discovery**: Confirmed that `jules.sources.list` returns a `nextPageToken` in the response and accepts `pageToken` as a query parameter.
- **Missing Pagination**: The existing implementation of `list_sources` only fetched the first page. If the user has many sources, and the target repo was not in the first page, `find_source_for_repo` would return `None`, causing the script to exit with an error.
- **Testing**: Added unit tests to verify pagination logic.

## Resolution (Second Attempt)
1. **Implemented Pagination**: Updated `jules.py` to loop through all pages of sources using `nextPageToken`.
2. **Enhanced Logging**: Added logging for the `create_session` payload and the number of sources fetched.
3. **Verified with Tests**: Added `test_list_sources_pagination` to `tests/test_jules_client.py` and verified it passes.
