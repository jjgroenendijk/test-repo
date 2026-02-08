import argparse
import json
import os
import subprocess
import sys
import time


def run_command(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        printable_command = " ".join(command)
        print(f"Error running command: {printable_command}")
        if e.stderr:
            print(f"Stderr: {e.stderr}")
        return None


def get_repo_full_name():
    repo = os.environ.get("GITHUB_REPOSITORY")
    if repo:
        return repo
    output = run_command(["gh", "repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"])
    if output:
        return output
    return None


def get_pr_details(pr_number):
    output = run_command(
        ["gh", "pr", "view", str(pr_number), "--json", "number,mergeable,url,title,author"]
    )
    if output:
        return json.loads(output)
    return None


def list_open_prs():
    output = run_command(
        ["gh", "pr", "list", "--state", "open", "--json", "number,mergeable,url,title,author", "--limit", "100"]
    )
    if output:
        return json.loads(output)
    return []


def list_open_issues(repo_full_name):
    output = run_command(["gh", "api", f"repos/{repo_full_name}/issues?state=open&per_page=100"])
    if output:
        return json.loads(output)
    return []


def find_existing_conflict_issue(repo_full_name, title_search):
    for issue in list_open_issues(repo_full_name):
        if "pull_request" in issue:
            continue
        if issue.get("title") == title_search:
            return str(issue["number"])
    return None


def create_conflict_issue(repo_full_name, title, body):
    output = run_command(
        [
            "gh",
            "api",
            f"repos/{repo_full_name}/issues",
            "-X",
            "POST",
            "-f",
            f"title={title}",
            "-f",
            f"body={body}",
            "-q",
            ".number",
        ]
    )
    if output:
        return output.strip()
    return None


def check_and_report_conflict(pr, repo_full_name):
    number = pr["number"]
    mergeable = pr["mergeable"]

    if mergeable == "UNKNOWN":
        print(f"PR #{number} mergeable status is UNKNOWN. Retrying in 5 seconds...")
        time.sleep(5)
        updated_pr = get_pr_details(number)
        if updated_pr:
            mergeable = updated_pr["mergeable"]
            print(f"PR #{number} updated status: {mergeable}")
        else:
            print(f"Failed to refresh PR #{number}")
            return

    if mergeable != "CONFLICTING":
        print(f"PR #{number} is {mergeable}. Skipping.")
        return

    print(f"PR #{number} has conflicts.")
    title_search = f"Merge Conflict: PR #{number}"
    existing_issue = find_existing_conflict_issue(repo_full_name, title_search)
    if existing_issue:
        print(f"Open issue already exists for PR #{number} (Issue #{existing_issue}). Skipping.")
        return

    print(f"Creating conflict issue for PR #{number}...")
    body = f"The PR #{number} has merge conflicts. A Jules session is requested to resolve this."
    issue_number = create_conflict_issue(repo_full_name, title_search, body)

    if issue_number:
        print(f"Created issue #{issue_number}. Triggering Jules...")
    else:
        print("Issue creation command failed. Searching for recently created issue...")
        time.sleep(2)
        issue_number = find_existing_conflict_issue(repo_full_name, title_search)
        if issue_number:
            print(f"Found issue #{issue_number} (created despite error). Triggering Jules...")
        else:
            print(f"ERROR: Failed to create or find issue for PR #{number}")
            return

    trigger_result = run_command(
        ["gh", "workflow", "run", "run-agent.yml", "-f", f"issue_number={issue_number}"]
    )
    if trigger_result is None:
        print(f"Warning: Failed to trigger Jules workflow for issue #{issue_number}")
    else:
        print(f"Successfully triggered Jules workflow for issue #{issue_number}")


def main():
    parser = argparse.ArgumentParser(description="Detect merge conflicts in PRs.")
    parser.add_argument("--pr-number", type=int, help="Specific PR number to check")
    args = parser.parse_args()

    repo_full_name = get_repo_full_name()
    if not repo_full_name:
        print("Could not determine repository name.")
        sys.exit(1)

    if args.pr_number:
        print(f"Checking specific PR #{args.pr_number}...")
        pr = get_pr_details(args.pr_number)
        if pr:
            check_and_report_conflict(pr, repo_full_name)
        else:
            print(f"Could not find PR #{args.pr_number}")
            sys.exit(1)
    else:
        print("Checking all open PRs...")
        for pr in list_open_prs():
            check_and_report_conflict(pr, repo_full_name)


if __name__ == "__main__":
    main()
