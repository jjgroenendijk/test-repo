import argparse
import json
import subprocess
import time
import sys
import os

def run_command(command):
    try:
        # Use shell=True for complex commands with pipes/quotes, but be careful with inputs.
        # Here we construct commands carefully.
        result = subprocess.run(command, capture_output=True, text=True, shell=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Stderr: {e.stderr}")
        return None

def get_pr_details(pr_number):
    cmd = f"gh pr view {pr_number} --json number,mergeable,url,title,author"
    output = run_command(cmd)
    if output:
        return json.loads(output)
    return None

def list_open_prs():
    cmd = "gh pr list --state open --json number,mergeable,url,title,author --limit 100"
    output = run_command(cmd)
    if output:
        return json.loads(output)
    return []

def check_and_report_conflict(pr):
    number = pr['number']
    mergeable = pr['mergeable']

    # Retry if UNKNOWN
    if mergeable == 'UNKNOWN':
        print(f"PR #{number} mergeable status is UNKNOWN. Retrying in 5 seconds...")
        time.sleep(5)
        # Fetch again
        updated_pr = get_pr_details(number)
        if updated_pr:
            mergeable = updated_pr['mergeable']
            print(f"PR #{number} updated status: {mergeable}")
        else:
            print(f"Failed to refresh PR #{number}")
            return

    if mergeable != 'CONFLICTING':
        print(f"PR #{number} is {mergeable}. Skipping.")
        return

    print(f"PR #{number} has conflicts.")

    # Check for existing issue
    title_search = f"Merge Conflict: PR #{number}"

    # Construct search query.
    # We use explicit repo qualifier if GITHUB_REPOSITORY is set, otherwise rely on context.
    repo_qualifier = ""
    if "GITHUB_REPOSITORY" in os.environ:
        repo_qualifier = f"repo:{os.environ['GITHUB_REPOSITORY']} "

    search_query = f'{repo_qualifier}"{title_search}" in:title is:issue is:open'

    # Escape quotes in search query for shell
    search_query_escaped = search_query.replace('"', '\\"')

    cmd = f'gh issue list --search "{search_query_escaped}" --json number'
    output = run_command(cmd)

    if output:
        issues = json.loads(output)
        if issues:
            print(f"Open issue already exists for PR #{number} (Issue #{issues[0]['number']}). Skipping.")
            return

    print(f"Creating conflict issue for PR #{number}...")
    body = f"The PR #{number} has merge conflicts. A Jules session is requested to resolve this."

    # Create issue
    # We use temporary file for body to avoid shell escaping hell if body gets complex
    # But here body is simple.
    cmd = f'gh issue create --title "{title_search}" --body "{body}"'
    issue_url = run_command(cmd)

    issue_number = None
    if issue_url and '/issues/' in issue_url:
        # Extract issue number. URL format: https://github.com/owner/repo/issues/123
        issue_number = issue_url.strip().split('/')[-1]
        print(f"Created issue #{issue_number}. Triggering Jules...")
    elif issue_url is None:
        # Issue creation may have failed but issue might exist - search for it
        print("Issue creation command failed. Searching for recently created issue...")
        time.sleep(2)
        search_cmd = f'gh issue list --search "{title_search} in:title is:issue is:open" --json number -q ".[0].number"'
        search_output = run_command(search_cmd)
        if search_output:
            issue_number = search_output.strip()
            print(f"Found issue #{issue_number} (created despite error). Triggering Jules...")
        else:
            print(f"ERROR: Failed to create or find issue for PR #{number}")
            return
    else:
        print(f"Unexpected response from issue create: {issue_url}")
        return

    # Trigger run-agent.yml
    trigger_cmd = f'gh workflow run run-agent.yml -f issue_number="{issue_number}"'
    trigger_result = run_command(trigger_cmd)
    if trigger_result is None:
        print(f"Warning: Failed to trigger Jules workflow for issue #{issue_number}")
    else:
        print(f"Successfully triggered Jules workflow for issue #{issue_number}")

def main():
    parser = argparse.ArgumentParser(description='Detect merge conflicts in PRs.')
    parser.add_argument('--pr-number', type=int, help='Specific PR number to check')
    args = parser.parse_args()

    if args.pr_number:
        print(f"Checking specific PR #{args.pr_number}...")
        pr = get_pr_details(args.pr_number)
        if pr:
            check_and_report_conflict(pr)
        else:
            print(f"Could not find PR #{args.pr_number}")
            sys.exit(1)
    else:
        print("Checking all open PRs...")
        prs = list_open_prs()
        for pr in prs:
            check_and_report_conflict(pr)

if __name__ == "__main__":
    main()
