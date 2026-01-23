#!/bin/bash
set -e

# Mock GH CLI
function gh() {
    echo "[MOCK GH] $@"
    if [[ "$1" == "pr" && "$2" == "list" ]]; then
        echo '[{"number": 123}]'
    elif [[ "$1" == "issue" && "$2" == "create" ]]; then
        echo "https://github.com/owner/repo/issues/456"
    fi
}
export -f gh

# Mock jq
function jq() {
    if [[ "$2" == "workflow_run.json" ]]; then
        echo "123" # Mock PR number
    else
        echo ""
    fi
}
export -f jq

# Setup mock environment
export GITHUB_REPOSITORY="owner/repo"
export RUN_ID="111"

echo "Creating dummy files..."
echo '{"pull_requests": [{"number": 123}]}' > workflow_run.json
echo "Error: Test Failure" > failed.log
echo "Snippet of error" > snippet.txt

echo "Running simulation..."

# --- Extracted Logic from YAML ---
# Read JSON (Mocked via file creation above)
PR_NUMBERS="123" # Hardcoded for simulation as jq is mocked

if [ -z "$PR_NUMBERS" ]; then
    echo "No PRs associated with this run."
    exit 0
fi

# gh run view "$RUN_ID" --log-failed > failed.log 2>&1 || echo "Failed to retrieve logs" > failed.log
# (Skipped as we created failed.log)

# python3 .github/scripts/extract_log.py failed.log > snippet.txt
# (Skipped as we created snippet.txt)

for PR_NUMBER in $PR_NUMBERS; do
    echo "Creating issue for PR #$PR_NUMBER"

    echo "The CI check failed for PR #$PR_NUMBER." > issue_body.md
    echo "" >> issue_body.md
    echo "**Log Snippet:**" >> issue_body.md
    echo "\`\`\`" >> issue_body.md
    cat snippet.txt >> issue_body.md
    echo "\`\`\`" >> issue_body.md

    # Capture output
    ISSUE_URL=$(gh issue create \
      --repo $GITHUB_REPOSITORY \
      --title "CI Failure: PR #$PR_NUMBER" \
      --body-file issue_body.md)

    echo "Created issue: $ISSUE_URL"
    # Extract number from URL (e.g., https://github.com/owner/repo/issues/123 -> 123)
    ISSUE_NUMBER=${ISSUE_URL##*/}

    echo "Triggering Jules for issue #$ISSUE_NUMBER..."
    gh workflow run jules.yml -f issue_number="$ISSUE_NUMBER"
done
# -------------------------------

echo "Simulation complete."
rm workflow_run.json failed.log snippet.txt issue_body.md
