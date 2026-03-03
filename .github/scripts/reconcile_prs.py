import argparse
import json
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

PASSING_CHECK_STATES = {"SUCCESS", "PASS", "SKIPPED", "SKIP", "NEUTRAL"}
WAITING_CHECK_STATES = {"PENDING", "QUEUED", "IN_PROGRESS", "WAITING", "REQUESTED"}
SESSION_ID_PATTERN = re.compile(r"\*\*Session ID:\*\* `(sessions/[^`]+)`")
PR_AUTOMATION_MARKER_PATTERN = re.compile(r"<!--\s*pr-automation:pr=(\d+)\s*-->")
QUEUE_MARKER_PATTERN = re.compile(r"<!--\s*jules-queue\s*-->")
CI_FAILURE_TITLE_PATTERN = re.compile(r"^CI Failure: PR #(\d+)$")
MERGE_CONFLICT_TITLE_PATTERN = re.compile(r"^Merge Conflict: PR #(\d+)$")
GENERIC_AUTOMATION_TITLE_PATTERN = re.compile(r"^PR Automation: PR #(\d+) requires attention$")
QUEUE_RETRY_INTERVAL = timedelta(hours=1)


@dataclass
class ReconcileStats:
    scanned: int = 0
    merged: int = 0
    issues_created: int = 0
    issues_closed: int = 0
    sessions_triggered: int = 0
    errors: int = 0


@dataclass
class IssueJulesState:
    has_session: bool = False
    queued: bool = False
    last_queue_comment_at: datetime | None = None

    def should_retry(self, now: datetime | None = None):
        if self.has_session:
            return False

        if not self.queued:
            return True

        if self.last_queue_comment_at is None:
            return True

        current_time = now or datetime.now(timezone.utc)
        return current_time - self.last_queue_comment_at >= QUEUE_RETRY_INTERVAL


class GitHubCLI:
    def __init__(self, repo: str, dry_run: bool = False):
        self.repo = repo
        self.dry_run = dry_run
        self._issues_cache = None
        self._issue_state_cache: dict[int, IssueJulesState] = {}

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

    def list_open_automation_issues(self):
        issues = []
        for issue in self._list_open_issues():
            if linked_pr_number_for_issue(issue) is None:
                continue
            issues.append(issue)
        return issues

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

    def find_open_issue_numbers_for_pr(self, pr_number: int):
        titles = {
            ci_failure_issue_title_for_pr(pr_number),
            issue_title_for_pr(pr_number),
            conflict_issue_title_for_pr(pr_number),
        }

        issue_numbers: list[int] = []
        for issue in self._list_open_issues():
            issue_number = int(issue["number"])
            title = issue.get("title", "")
            if title in titles:
                issue_numbers.append(issue_number)
                continue

            marker = PR_AUTOMATION_MARKER_PATTERN.search(str(issue.get("body", "")))
            if marker and int(marker.group(1)) == pr_number:
                issue_numbers.append(issue_number)

        return sorted(set(issue_numbers))

    def close_issue(self, issue_number: int, reason: str):
        if self.dry_run:
            print(f"[dry-run] Would close issue #{issue_number}")
            return True

        result = self.run(
            [
                "gh",
                "issue",
                "close",
                str(issue_number),
                "--repo",
                self.repo,
                "--comment",
                reason,
            ],
            check=False,
        )
        if not result or result.returncode != 0:
            return False

        if self._issues_cache is not None:
            self._issues_cache = [
                issue for issue in self._issues_cache if int(issue.get("number", -1)) != issue_number
            ]

        return True

    def get_issue_jules_state(self, issue_number: int):
        if issue_number in self._issue_state_cache:
            return self._issue_state_cache[issue_number]

        comments = self.run_json(
            [
                "gh",
                "api",
                f"repos/{self.repo}/issues/{issue_number}/comments?per_page=100",
            ]
        )
        if not isinstance(comments, list):
            state = IssueJulesState()
            self._issue_state_cache[issue_number] = state
            return state

        state = IssueJulesState()
        for comment in comments:
            body = comment.get("body", "")
            if SESSION_ID_PATTERN.search(body):
                state.has_session = True

            if QUEUE_MARKER_PATTERN.search(body):
                state.queued = True
                created_at = parse_github_timestamp(comment.get("created_at") or comment.get("createdAt"))
                if created_at and (
                    state.last_queue_comment_at is None or created_at > state.last_queue_comment_at
                ):
                    state.last_queue_comment_at = created_at

        self._issue_state_cache[issue_number] = state
        return state

    def issue_has_jules_session(self, issue_number: int):
        return self.get_issue_jules_state(issue_number).has_session

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

    def drop_issue_from_cache(self, issue_number: int):
        self._issue_state_cache.pop(issue_number, None)


def issue_title_for_pr(pr_number: int):
    return f"PR Automation: PR #{pr_number} requires attention"


def ci_failure_issue_title_for_pr(pr_number: int):
    return f"CI Failure: PR #{pr_number}"


def conflict_issue_title_for_pr(pr_number: int):
    return f"Merge Conflict: PR #{pr_number}"


def parse_github_timestamp(value: str | None):
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def linked_pr_number_for_issue(issue: dict):
    marker = PR_AUTOMATION_MARKER_PATTERN.search(str(issue.get("body", "")))
    if marker:
        return int(marker.group(1))

    title = str(issue.get("title", ""))
    for pattern in (
        CI_FAILURE_TITLE_PATTERN,
        MERGE_CONFLICT_TITLE_PATTERN,
        GENERIC_AUTOMATION_TITLE_PATTERN,
    ):
        match = pattern.match(title)
        if match:
            return int(match.group(1))

    return None


def canonical_issue_number(issues: list[dict], issue_states: dict[int, IssueJulesState]):
    def sort_key(issue: dict):
        issue_number = int(issue["number"])
        state = issue_states.get(issue_number, IssueJulesState())
        return (0 if state.has_session else 1, issue_number)

    return int(min(issues, key=sort_key)["number"])


def normalize_check_state(check: dict):
    return str(check.get("state") or "UNKNOWN").upper()


def is_passing_check_state(state: str):
    return state.upper() in PASSING_CHECK_STATES


def is_waiting_check_state(state: str):
    return state.upper() in WAITING_CHECK_STATES


def waiting_checks(checks: list[dict]):
    waiting = []
    for check in checks:
        state = normalize_check_state(check)
        if is_waiting_check_state(state):
            waiting.append(check)
    return waiting


def blocking_checks(checks: list[dict]):
    blocked = []
    for check in checks:
        state = normalize_check_state(check)
        if is_passing_check_state(state) or is_waiting_check_state(state):
            continue
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
        processed_pr_numbers = set(numbers)
        if not numbers:
            print("No open PRs to process.")
        else:
            for pr_number in numbers:
                self.reconcile_pr(pr_number)

        self.recover_automation_issues(processed_pr_numbers)

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
        pr_number = int(pr["number"])
        title = issue_title_for_pr(pr_number)
        linked_issue_numbers = self.client.find_open_issue_numbers_for_pr(pr_number)
        issue_number = linked_issue_numbers[0] if linked_issue_numbers else None

        if issue_number is None:
            body = build_issue_body(pr, reasons, blocked)
            issue_number = self.client.create_issue(title, body)
            if issue_number is None:
                print(f"Failed to create issue for PR #{pr['number']}")
                self.stats.errors += 1
                return
            self.stats.issues_created += 1
            print(f"Created issue #{issue_number} for PR #{pr['number']}")

        if self.client.issue_has_jules_session(issue_number):
            print(f"Issue #{issue_number} already has a Jules session.")
            return

        self._trigger_issue_if_ready(issue_number)

    def _close_linked_issues(self, pr_number: int, reason: str):
        issue_numbers = self.client.find_open_issue_numbers_for_pr(pr_number)
        if not issue_numbers:
            return

        for issue_number in issue_numbers:
            if self.client.close_issue(issue_number, reason):
                self.stats.issues_closed += 1
                print(f"Closed issue #{issue_number} for PR #{pr_number}")
                continue

            self.stats.errors += 1
            print(f"Failed to close issue #{issue_number} for PR #{pr_number}")

    def _close_issue(self, issue_number: int, reason: str):
        if self.client.close_issue(issue_number, reason):
            self.client.drop_issue_from_cache(issue_number)
            self.stats.issues_closed += 1
            print(f"Closed issue #{issue_number}")
            return True

        self.stats.errors += 1
        print(f"Failed to close issue #{issue_number}")
        return False

    def _trigger_issue_if_ready(self, issue_number: int):
        state = self.client.get_issue_jules_state(issue_number)
        if not state.should_retry():
            print(f"Issue #{issue_number} is queued for retry and not ready yet.")
            return

        print(f"Issue #{issue_number} is ready for Jules recovery. Triggering run-agent workflow.")
        if self.client.trigger_jules_session(issue_number):
            self.stats.sessions_triggered += 1
            self.client.drop_issue_from_cache(issue_number)
            return

        print(f"Failed to trigger Jules for issue #{issue_number}")
        self.stats.errors += 1

    def recover_automation_issues(self, processed_pr_numbers: set[int]):
        grouped: dict[int, list[dict]] = {}
        for issue in self.client.list_open_automation_issues():
            pr_number = linked_pr_number_for_issue(issue)
            if pr_number is None:
                continue
            grouped.setdefault(pr_number, []).append(issue)

        for pr_number, issues in sorted(grouped.items()):
            issue_states = {
                int(issue["number"]): self.client.get_issue_jules_state(int(issue["number"]))
                for issue in issues
            }
            canonical_number = canonical_issue_number(issues, issue_states)

            for issue in sorted(issues, key=lambda item: int(item["number"])):
                issue_number = int(issue["number"])
                if issue_number == canonical_number:
                    continue
                self._close_issue(
                    issue_number,
                    (
                        f"Closing automatically as a duplicate automation issue for PR #{pr_number}. "
                        f"Issue #{canonical_number} remains the canonical tracker."
                    ),
                )

            if pr_number in processed_pr_numbers:
                continue

            pr = self.client.get_pr(pr_number)
            if not pr or pr.get("state") != "OPEN":
                self._close_issue(
                    canonical_number,
                    f"Closing automatically because PR #{pr_number} is no longer open.",
                )
                continue

            self._trigger_issue_if_ready(canonical_number)

    def reconcile_pr(self, pr_number: int):
        self.stats.scanned += 1
        pr = self.client.get_pr(pr_number)
        if not pr:
            print(f"Unable to load PR #{pr_number}")
            self.stats.errors += 1
            return

        if pr.get("state") != "OPEN":
            print(f"PR #{pr_number} is {pr.get('state')}. Skipping.")
            self._close_linked_issues(
                pr_number,
                f"Closing automatically because PR #{pr_number} is {str(pr.get('state')).lower()}.",
            )
            return

        mergeable = self._resolve_mergeable(pr_number, str(pr.get("mergeable") or "UNKNOWN"))
        checks = self.client.get_pr_checks(pr_number)
        waiting = waiting_checks(checks)
        blocked = blocking_checks(checks)

        reasons = []
        if str(mergeable).upper() == "CONFLICTING":
            reasons.append("Merge conflict detected.")

        if blocked:
            reasons.append("PR checks are not passing.")

        if reasons:
            self._ensure_issue_and_session(pr, reasons, blocked)
            return

        if waiting:
            print(f"PR #{pr_number} still has non-terminal checks; waiting for CI to finish.")
            return

        if self.client.merge_pr(pr_number):
            self.stats.merged += 1
            print(f"Merged PR #{pr_number}")
            self._close_linked_issues(
                pr_number,
                f"Closing automatically because PR #{pr_number} has been merged.",
            )
            return

        print(f"Merge failed for PR #{pr_number}; collecting diagnostics.")
        refreshed_pr = self.client.get_pr(pr_number) or pr
        refreshed_mergeable = self._resolve_mergeable(
            pr_number, str(refreshed_pr.get("mergeable") or "UNKNOWN")
        )
        refreshed_checks = self.client.get_pr_checks(pr_number)
        refreshed_waiting = waiting_checks(refreshed_checks)
        refreshed_blocked = blocking_checks(refreshed_checks)

        if refreshed_waiting and str(refreshed_mergeable).upper() != "CONFLICTING" and not refreshed_blocked:
            print(f"PR #{pr_number} has non-terminal checks after merge attempt; waiting for CI to finish.")
            return

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
        f"issues_created={stats.issues_created}, issues_closed={stats.issues_closed}, "
        f"sessions_triggered={stats.sessions_triggered}, "
        f"errors={stats.errors}"
    )

    return 1 if stats.errors else 0


if __name__ == "__main__":
    sys.exit(main())
