import argparse
import json
import subprocess
import time
import sys
import os
import re

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

    if issue_url:
        # Extract issue number. URL format: https://github.com/owner/repo/issues/123
        issue_number = issue_url.strip().split('/')[-1]
        print(f"Created issue #{issue_number}. Triggering Jules...")

        # Trigger run-agent.yml
        trigger_cmd = f'gh workflow run run-agent.yml -f issue_number="{issue_number}"'
        run_command(trigger_cmd)
    else:
        print("Failed to create issue.")

def cleanup_stale_issues():
    print("Checking for stale conflict issues...")
    # Search for all open issues with "Merge Conflict: PR #" in title
    repo_qualifier = ""
    if "GITHUB_REPOSITORY" in os.environ:
        repo_qualifier = f"repo:{os.environ['GITHUB_REPOSITORY']} "

    search_query = f'{repo_qualifier}"Merge Conflict: PR #" in:title is:issue is:open'
    search_query_escaped = search_query.replace('"', '\\"')

    cmd = f'gh issue list --search "{search_query_escaped}" --json number,title'
    output = run_command(cmd)

    if not output:
        return

    try:
        issues = json.loads(output)
    except json.JSONDecodeError:
        print("Error parsing issue list json")
        return

    for issue in issues:
        title = issue['title']
        match = re.search(r"Merge Conflict: PR #(\d+)", title)
        if match:
            pr_number = match.group(1)
            print(f"Checking status of PR #{pr_number} for Issue #{issue['number']}...")

            # Check PR status
            pr = get_pr_details(pr_number)

            should_close = False
            comment = ""

            if not pr:
                should_close = True
                comment = "Closing this issue because the associated PR seems to be deleted or inaccessible."
            else:
                state = pr.get('state', 'UNKNOWN')
                mergeable = pr.get('mergeable', 'UNKNOWN')

                if state in ['MERGED', 'CLOSED']:
                    should_close = True
                    comment = f"Closing this issue because PR #{pr_number} is {state}."
                else:
                    # Retry UNKNOWN once
                    if mergeable == 'UNKNOWN':
                        time.sleep(2)
                        updated_pr = get_pr_details(pr_number)
                        if updated_pr:
                            mergeable = updated_pr.get('mergeable', 'UNKNOWN')

                    if mergeable != 'CONFLICTING' and mergeable != 'UNKNOWN':
                        should_close = True
                        comment = f"Closing this issue because PR #{pr_number} no longer has conflicts (Status: {mergeable})."

            if should_close:
                print(f"Closing Issue #{issue['number']}: {comment}")
                run_command(f'gh issue comment {issue["number"]} --body "{comment}"')
                run_command(f'gh issue close {issue["number"]}')

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

        cleanup_stale_issues()

if __name__ == "__main__":
    main()
