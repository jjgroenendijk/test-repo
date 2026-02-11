import argparse
import json
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass

PASSING_CHECK_STATES = {"SUCCESS", "PASS", "SKIPPED", "SKIP", "NEUTRAL"}
SESSION_ID_PATTERN = re.compile(r"\*\*Session ID:\*\* `(sessions/[^`]+)`")


@dataclass
class ReconcileStats:
    scanned: int = 0
    merged: int = 0
    issues_created: int = 0
    sessions_triggered: int = 0
    errors: int = 0


class GitHubCLI:
    def __init__(self, repo: str, dry_run: bool = False):
        self.repo = repo
        self.dry_run = dry_run
        self._issues_cache = None

    def run(self, command: list[str], check: bool = True):
        result = subprocess.run(command, capture_output=True, text=True)
        if check and result.returncode != 0:
            printable = " ".join(command)
            print(f"Command failed: {printable}")
            if result.stderr:
                print(result.stderr.strip())
            return None
        return result

    def run_json(self, command: list[str]):
        result = self.run(command, check=True)
        if result is None:
            return None

        stdout = result.stdout.strip()
        if not stdout:
            return None

        try:
            return json.loads(stdout)
        except json.JSONDecodeError:
            printable = " ".join(command)
            print(f"Failed to decode JSON output: {printable}")
            return None

    def list_open_pr_numbers(self):
        data = self.run_json(
            [
                "gh",
                "pr",
                "list",
                "--repo",
                self.repo,
                "--state",
                "open",
                "--limit",
                "100",
                "--json",
                "number",
            ]
        )
        if not data:
            return []
        return [int(pr["number"]) for pr in data]

    def get_pr(self, pr_number: int):
        return self.run_json(
            [
                "gh",
                "pr",
                "view",
                str(pr_number),
                "--repo",
                self.repo,
                "--json",
                "number,title,url,mergeable,isDraft,state",
            ]
        )

    def get_pr_checks(self, pr_number: int):
        result = self.run(
            [
                "gh",
                "pr",
                "checks",
                str(pr_number),
                "--repo",
                self.repo,
                "--json",
                "name,state,link",
            ],
            check=False,
        )
        if result is None:
            return []

        stdout = result.stdout.strip()
        if not stdout:
            return []

        try:
            checks = json.loads(stdout)
        except json.JSONDecodeError:
            return []

        if isinstance(checks, list):
            return checks
        return []

    def merge_pr(self, pr_number: int):
        if self.dry_run:
            print(f"[dry-run] Would merge PR #{pr_number}")
            return True

        # Approval is best-effort; some repos do not allow bot approvals.
        self.run(
            [
                "gh",
                "pr",
                "review",
                str(pr_number),
                "--repo",
                self.repo,
                "--approve",
            ],
            check=False,
        )

        result = self.run(
            [
                "gh",
                "pr",
                "merge",
                str(pr_number),
                "--repo",
                self.repo,
                "--merge",
                "--delete-branch",
            ],
            check=False,
        )
        return bool(result and result.returncode == 0)

    def _list_open_issues(self):
        if self._issues_cache is not None:
            return self._issues_cache

        data = self.run_json(["gh", "api", f"repos/{self.repo}/issues?state=open&per_page=100"])
        if not isinstance(data, list):
            self._issues_cache = []
            return self._issues_cache

        self._issues_cache = [issue for issue in data if "pull_request" not in issue]
        return self._issues_cache

    def find_open_issue_by_title(self, title: str):
        for issue in self._list_open_issues():
            if issue.get("title") == title:
                return int(issue["number"])
        return None

    def create_issue(self, title: str, body: str):
        if self.dry_run:
            print(f"[dry-run] Would create issue: {title}")
            return 0

        result = self.run(
            [
                "gh",
                "api",
                f"repos/{self.repo}/issues",
                "-X",
                "POST",
                "-f",
                f"title={title}",
                "-f",
                f"body={body}",
                "-q",
                ".number",
            ],
            check=True,
        )
        if result is None:
            return None

        issue_number_text = result.stdout.strip()
        if not issue_number_text.isdigit():
            return None

        issue_number = int(issue_number_text)
        if self._issues_cache is not None:
            self._issues_cache.append({"number": issue_number, "title": title})
        return issue_number

    def issue_has_jules_session(self, issue_number: int):
        comments = self.run_json(
            [
                "gh",
                "api",
                f"repos/{self.repo}/issues/{issue_number}/comments?per_page=100",
            ]
        )
        if not isinstance(comments, list):
            return False

        for comment in comments:
            body = comment.get("body", "")
            if SESSION_ID_PATTERN.search(body):
                return True
        return False

    def trigger_jules_session(self, issue_number: int):
        if self.dry_run:
            print(f"[dry-run] Would trigger run-agent.yml for issue #{issue_number}")
            return True

        result = self.run(
            [
                "gh",
                "workflow",
                "run",
                "run-agent.yml",
                "--repo",
                self.repo,
                "-f",
                f"issue_number={issue_number}",
            ],
            check=False,
        )
        return bool(result and result.returncode == 0)


def issue_title_for_pr(pr_number: int):
    return f"PR Automation: PR #{pr_number} requires attention"


def normalize_check_state(check: dict):
    return str(check.get("state") or "UNKNOWN").upper()


def is_passing_check_state(state: str):
    return state.upper() in PASSING_CHECK_STATES


def blocking_checks(checks: list[dict]):
    blocked = []
    for check in checks:
        state = normalize_check_state(check)
        if not is_passing_check_state(state):
            blocked.append(check)
    return blocked


def summarize_blocking_checks(checks: list[dict]):
    lines = []
    for check in checks:
        name = check.get("name", "(unnamed check)")
        state = normalize_check_state(check)
        lines.append(f"- `{name}`: `{state}`")
    return "\n".join(lines)


def build_issue_body(pr: dict, reasons: list[str], blocked: list[dict]):
    lines = [
        f"Automated PR reconciliation detected blockers for PR #{pr['number']}.",
        "",
        f"PR: {pr.get('url', '(missing url)')}",
        "",
        "## Blockers",
    ]

    for reason in reasons:
        lines.append(f"- {reason}")

    if blocked:
        lines.extend(["", "## Non-passing checks", summarize_blocking_checks(blocked)])

    lines.extend(
        [
            "",
            "Please resolve the blockers. A Jules session should handle this issue.",
            f"<!-- pr-automation:pr={pr['number']} -->",
        ]
    )
    return "\n".join(lines)


class PrReconciler:
    def __init__(self, client: GitHubCLI):
        self.client = client
        self.stats = ReconcileStats()

    def reconcile(self, pr_numbers: list[int] | None = None):
        numbers = pr_numbers or self.client.list_open_pr_numbers()
        if not numbers:
            print("No open PRs to process.")
            return self.stats

        for pr_number in numbers:
            self.reconcile_pr(pr_number)

        return self.stats

    def _resolve_mergeable(self, pr_number: int, initial_state: str):
        mergeable = (initial_state or "UNKNOWN").upper()
        if mergeable != "UNKNOWN":
            return mergeable

        for _ in range(3):
            time.sleep(2)
            refreshed = self.client.get_pr(pr_number)
            if not refreshed:
                break
            mergeable = str(refreshed.get("mergeable") or "UNKNOWN").upper()
            if mergeable != "UNKNOWN":
                return mergeable

        return mergeable

    def _ensure_issue_and_session(self, pr: dict, reasons: list[str], blocked: list[dict]):
        title = issue_title_for_pr(int(pr["number"]))
        issue_number = self.client.find_open_issue_by_title(title)
        created_new_issue = False

        if issue_number is None:
            body = build_issue_body(pr, reasons, blocked)
            issue_number = self.client.create_issue(title, body)
            if issue_number is None:
                print(f"Failed to create issue for PR #{pr['number']}")
                self.stats.errors += 1
                return
            created_new_issue = True
            self.stats.issues_created += 1
            print(f"Created issue #{issue_number} for PR #{pr['number']}")

        if created_new_issue:
            print(
                f"Issue #{issue_number} is new. Skipping manual Jules trigger to avoid duplicate sessions from issue-open events."
            )
            return

        if self.client.issue_has_jules_session(issue_number):
            print(f"Issue #{issue_number} already has a Jules session.")
            return

        print(f"Issue #{issue_number} has no Jules session. Triggering run-agent workflow.")
        if self.client.trigger_jules_session(issue_number):
            self.stats.sessions_triggered += 1
            return

        print(f"Failed to trigger Jules for issue #{issue_number}")
        self.stats.errors += 1

    def reconcile_pr(self, pr_number: int):
        self.stats.scanned += 1
        pr = self.client.get_pr(pr_number)
        if not pr:
            print(f"Unable to load PR #{pr_number}")
            self.stats.errors += 1
            return

        if pr.get("state") != "OPEN":
            print(f"PR #{pr_number} is {pr.get('state')}. Skipping.")
            return

        mergeable = self._resolve_mergeable(pr_number, str(pr.get("mergeable") or "UNKNOWN"))
        checks = self.client.get_pr_checks(pr_number)
        blocked = blocking_checks(checks)

        reasons = []
        if str(mergeable).upper() == "CONFLICTING":
            reasons.append("Merge conflict detected.")

        if blocked:
            reasons.append("PR checks are not passing.")

        if reasons:
            self._ensure_issue_and_session(pr, reasons, blocked)
            return

        if self.client.merge_pr(pr_number):
            self.stats.merged += 1
            print(f"Merged PR #{pr_number}")
            return

        print(f"Merge failed for PR #{pr_number}; collecting diagnostics.")
        refreshed_pr = self.client.get_pr(pr_number) or pr
        refreshed_mergeable = self._resolve_mergeable(
            pr_number, str(refreshed_pr.get("mergeable") or "UNKNOWN")
        )
        refreshed_checks = self.client.get_pr_checks(pr_number)
        refreshed_blocked = blocking_checks(refreshed_checks)

        fallback_reasons = []
        if str(refreshed_mergeable).upper() == "CONFLICTING":
            fallback_reasons.append("Merge conflict detected after merge attempt.")
        if refreshed_blocked:
            fallback_reasons.append("PR checks are not passing after merge attempt.")
        if not fallback_reasons:
            fallback_reasons.append("Automatic merge failed for an unknown reason.")

        self._ensure_issue_and_session(refreshed_pr, fallback_reasons, refreshed_blocked)


def resolve_repo(args_repo: str | None):
    if args_repo:
        return args_repo

    from_env = os.environ.get("GITHUB_REPOSITORY")
    if from_env:
        return from_env

    result = subprocess.run(
        ["gh", "repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip()

    return None


def parse_args():
    parser = argparse.ArgumentParser(description="Reconcile open PRs and recover Jules sessions.")
    parser.add_argument("--pr-number", type=int, help="Optional single PR number to reconcile")
    parser.add_argument("--repo", help="GitHub repo in owner/name format")
    parser.add_argument("--dry-run", action="store_true", help="Print intended changes only")
    return parser.parse_args()


def main():
    args = parse_args()
    repo = resolve_repo(args.repo)
    if not repo:
        print("Could not resolve repository. Set --repo or GITHUB_REPOSITORY.")
        return 1

    client = GitHubCLI(repo=repo, dry_run=args.dry_run)
    reconciler = PrReconciler(client)

    pr_numbers = [args.pr_number] if args.pr_number else None
    stats = reconciler.reconcile(pr_numbers)

    print(
        "Summary: "
        f"scanned={stats.scanned}, merged={stats.merged}, "
        f"issues_created={stats.issues_created}, sessions_triggered={stats.sessions_triggered}, "
        f"errors={stats.errors}"
    )

    return 1 if stats.errors else 0


if __name__ == "__main__":
    sys.exit(main())
