# Plan: Simplify Repo to Reusable Jules Workflows

## Goal
Reduce repository to GitHub workflow `.yml` files and a single `README.md` for use across other repos with Google Jules automation.

## Current State
- 6 workflows in `.github/workflows/`
- `jules.py` (295 lines) - Core Jules API client
- `setup.sh` - GitHub CLI installation
- `website/` - Next.js app (to be removed)
- `docs/`, `tests/` directories (to be removed)

## Final Structure
```
.
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── run-agent.yml              # Core Jules trigger (with inline shell)
│       ├── detect-merge-conflicts.yml
│       ├── report-ci-failure.yml
│       ├── manage-pr-lifecycle.yml
│       └── verify-codebase.yml        # Generic CI template
└── README.md
```

## Approach: Inline jules.py as Shell

Convert `jules.py` to inline `curl` + `jq` commands in `run-agent.yml`. The Python logic maps to shell:

| Python Function | Shell Equivalent |
|-----------------|------------------|
| `list_sources()` | `curl -s -H "x-goog-api-key: $API_KEY" "$JULES_API/sources"` |
| `find_source_for_repo()` | `jq` filter on sources JSON |
| `create_session()` | `curl -X POST` with JSON payload |
| `send_message()` | `curl -X POST` to `/{session_id}:sendMessage` |
| Event parsing | `jq` on `$GITHUB_EVENT_PATH` |
| Find session ID | `gh issue view --json comments` + `grep` |

Estimated: ~120 lines of bash (vs 295 lines Python)

### Shell Script Outline

```bash
JULES_API="https://jules.googleapis.com/v1alpha"
OWNER="${GITHUB_REPOSITORY%%/*}"
REPO="${GITHUB_REPOSITORY##*/}"

# 1. Determine action type
EVENT=$(jq -r '.action' "$GITHUB_EVENT_PATH")
if [ "$GITHUB_EVENT_NAME" = "workflow_dispatch" ]; then
  ISSUE_NUMBER="${{ inputs.issue_number }}"
  # Fetch issue details with gh
elif [ "$EVENT" = "created" ]; then
  # Handle comment - find session ID and forward message
elif [ "$EVENT" = "opened" ]; then
  # Handle new issue - create session
fi

# 2. Find source for repo
SOURCES=$(curl -s -H "x-goog-api-key: $GOOGLE_JULES_API" "$JULES_API/sources")
SOURCE_NAME=$(echo "$SOURCES" | jq -r --arg o "$OWNER" --arg r "$REPO" \
  '.sources[] | select(.githubRepo.owner | ascii_downcase == ($o | ascii_downcase)) |
   select(.githubRepo.repo | ascii_downcase == ($r | ascii_downcase)) | .name' | head -1)

# 3. Create session or send message
# 4. Post comment with result
```

## Workflows to Keep

| Workflow | Purpose | Changes Needed |
|----------|---------|----------------|
| `run-agent.yml` | Core Jules trigger | Replace Python with inline shell |
| `detect-merge-conflicts.yml` | Auto-detect conflicts | None (already inline shell) |
| `report-ci-failure.yml` | Report CI failures | Update workflow reference |
| `manage-pr-lifecycle.yml` | Auto-merge PRs | Make approved users configurable, remove dead script ref |
| `verify-codebase.yml` | CI template | Simplify to generic template |

## Workflows to Remove
- `deploy-website.yml` - Website being removed

## Implementation Tasks

### Phase 1: Convert run-agent.yml to Inline Shell
- [ ] Replace Python script with inline bash using `curl` + `jq`
- [ ] Implement Jules API calls:
  - `list_sources` → GET /sources
  - `find_source_for_repo` → jq filter for owner/repo match
  - `create_session` → POST /sessions with payload
  - `send_message` → POST /{session_id}:sendMessage
- [ ] Handle event types: `issues.opened`, `issue_comment.created`, `workflow_dispatch`
- [ ] Find session ID from issue comments using `gh` + regex
- [ ] Post success/error comments via `gh issue comment`

### Phase 2: Update Other Workflows
- [ ] `manage-pr-lifecycle.yml` (line 49 references deleted script):
  - Replace `python3 .github/scripts/detect_merge_conflicts.py --pr-number "$PR_NUMBER"`
  - With: `gh workflow run detect-merge-conflicts.yml` (already handles conflict detection)
  - Add comment documenting how to configure approved users (lines 17-19)
- [ ] `report-ci-failure.yml`:
  - Verify workflow name reference matches `verify-codebase.yml`
- [ ] `verify-codebase.yml`:
  - Remove `website-ci` job (lines 38-62)
  - Keep `python-ci` as a template with placeholder comments
  - Add comments explaining how to customize for other stacks

### Phase 3: Clean Up Files
- [ ] Delete `deploy-website.yml`
- [ ] Delete `jules.py`, `setup.sh`
- [ ] Delete `website/` directory
- [ ] Delete `docs/` directory
- [ ] Delete `tests/` directory
- [ ] Delete `pyproject.toml`, `uv.lock`, `.python-version`
- [ ] Simplify `dependabot.yml` (github-actions only)

### Phase 4: Write README.md

New README structure:

```markdown
# Jules Automation Workflows

Reusable GitHub Actions workflows for integrating with Google Jules.

## Prerequisites
- Google Jules API key (set as `GOOGLE_JULES_API` secret)
- Jules GitHub App installed on your repository

## Workflows

### run-agent.yml
Triggers Jules sessions from GitHub issues and forwards comments.

### detect-merge-conflicts.yml
Monitors PRs for merge conflicts and creates issues for resolution.

### report-ci-failure.yml
Creates issues when CI fails, triggering Jules to investigate.

### manage-pr-lifecycle.yml
Auto-approves and merges PRs from approved users.

### verify-codebase.yml
Generic CI template (customize for your project).

## Installation

1. Copy `.github/workflows/` to your repository
2. Set `GOOGLE_JULES_API` secret
3. Configure approved users in `manage-pr-lifecycle.yml` (line 17-19)
4. Customize `verify-codebase.yml` for your stack

## Configuration
- Approved users: Edit the `if` condition in `manage-pr-lifecycle.yml`
- CI workflow name: Update reference in `report-ci-failure.yml`
```

## Critical Files to Modify
- `.github/workflows/run-agent.yml` - Major rewrite (Python → Shell)
- `.github/workflows/manage-pr-lifecycle.yml` - Remove dead script reference
- `.github/workflows/verify-codebase.yml` - Simplify to template
- `README.md` - Complete rewrite

## Verification
1. Create a test issue → verify `run-agent.yml` triggers Jules session
2. Add a comment to the issue → verify message forwarding works
3. Create a PR → verify `manage-pr-lifecycle.yml` auto-approves
4. Trigger CI failure → verify `report-ci-failure.yml` creates issue
5. Create conflicting PR → verify `detect-merge-conflicts.yml` detects it
