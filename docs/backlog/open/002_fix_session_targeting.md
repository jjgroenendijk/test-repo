# Backlog Item 002: Fix Session Targeting for Multiple Sessions

**Status:** Open
**Assignee:** Unassigned

## Description
Update `jules.py` to correctly identify the most recent Jules session when processing issue comments.

## What
Modify the `find_session_id` logic in `jules.py` to scan all comments on an issue and return the Session ID from the *last* matching comment, rather than the first.

## Why
Currently, if a user manually restarts a Jules session (e.g., via `workflow_dispatch`), a new "Session Started" comment is posted with a new Session ID. However, the current implementation of `find_session_id` returns the first Session ID it finds in the comment history. This means any subsequent comments by the user are forwarded to the old, likely inactive session, effectively breaking the interaction with the new agent. By targeting the latest session, we ensure the user is always communicating with the active agent.
