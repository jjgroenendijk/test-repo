import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

AUTONOMOUS_MARKER = "<!-- autonomous-schedule -->"
AUTONOMOUS_TITLE = "Scheduled Autonomous Development"
SESSION_ID_PATTERN = re.compile(r"\*\*Session ID:\*\* `(sessions/[^`]+)`")


@dataclass
class ScheduleStats:
    issues_created: int = 0
    sessions_triggered: int = 0
    skipped_for_open_prs: int = 0
    skipped_for_cooldown: int = 0
    errors: int = 0


def parse_github_timestamp(value: str | None):
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


class GitHubCLI:
    def __init__(self, repo: str, dry_run: bool = False):
        self.repo = repo
        self.dry_run = dry_run

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
        if not isinstance(data, list):
            return []
        return [int(pr["number"]) for pr in data]

    def list_open_issues(self):
        data = self.run_json(["gh", "api", f"repos/{self.repo}/issues?state=open&per_page=100"])
        if not isinstance(data, list):
            return []
        return [issue for issue in data if "pull_request" not in issue]

    def find_autonomous_issue(self):
        for issue in self.list_open_issues():
            body = str(issue.get("body", ""))
            if AUTONOMOUS_MARKER in body:
                return int(issue["number"])

        for issue in self.list_open_issues():
            if issue.get("title") == AUTONOMOUS_TITLE:
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

        return int(issue_number_text)

    def get_issue_comments(self, issue_number: int):
        data = self.run_json(
            [
                "gh",
                "api",
                f"repos/{self.repo}/issues/{issue_number}/comments?per_page=100",
            ]
        )
        if not isinstance(data, list):
            return []
        return data

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


def build_issue_body():
    lines = [
        "This reusable issue exists so GitHub Actions can start scheduled Jules runs through the normal issue-backed bridge.",
        "",
        "On each run:",
        "1. Follow `AGENTS.md` exactly.",
        "2. Prioritize `docs/troubleshooting/open/`, then `docs/backlog/open/`, then unsatisfied requirements.",
        "3. If no work is open, propose and implement one small high-value improvement for the yt-dlp web interface.",
        "4. Deliver the change through the normal Jules `AUTO_CREATE_PR` flow with tests and docs updates where applicable.",
        "",
        AUTONOMOUS_MARKER,
    ]
    return "\n".join(lines)


class AutonomousScheduler:
    def __init__(self, client: GitHubCLI, cooldown: timedelta, force: bool = False):
        self.client = client
        self.cooldown = cooldown
        self.force = force
        self.stats = ScheduleStats()

    def ensure_issue(self):
        issue_number = self.client.find_autonomous_issue()
        if issue_number is not None:
            return issue_number

        issue_number = self.client.create_issue(AUTONOMOUS_TITLE, build_issue_body())
        if issue_number is None:
            self.stats.errors += 1
            print("Failed to create scheduled autonomy issue.")
            return None

        self.stats.issues_created += 1
        print(f"Created scheduled autonomy issue #{issue_number}")
        return issue_number

    def latest_session_comment_at(self, issue_number: int):
        latest = None
        for comment in self.client.get_issue_comments(issue_number):
            body = str(comment.get("body", ""))
            if not SESSION_ID_PATTERN.search(body):
                continue

            created_at = parse_github_timestamp(comment.get("created_at") or comment.get("createdAt"))
            if created_at and (latest is None or created_at > latest):
                latest = created_at

        return latest

    def should_skip_for_cooldown(self, issue_number: int, now: datetime | None = None):
        if self.force:
            return False

        latest = self.latest_session_comment_at(issue_number)
        if latest is None:
            return False

        current_time = now or datetime.now(timezone.utc)
        return current_time - latest < self.cooldown

    def run(self, now: datetime | None = None):
        open_prs = self.client.list_open_pr_numbers()
        if open_prs:
            self.stats.skipped_for_open_prs += 1
            print(f"Skipping scheduled autonomy because open PRs exist: {open_prs}")
            return self.stats

        issue_number = self.ensure_issue()
        if issue_number is None:
            return self.stats

        if self.should_skip_for_cooldown(issue_number, now=now):
            self.stats.skipped_for_cooldown += 1
            print(f"Skipping scheduled autonomy because issue #{issue_number} is inside cooldown.")
            return self.stats

        print(f"Triggering scheduled Jules session via issue #{issue_number}")
        if self.client.trigger_jules_session(issue_number):
            self.stats.sessions_triggered += 1
            return self.stats

        self.stats.errors += 1
        print(f"Failed to trigger scheduled Jules session for issue #{issue_number}")
        return self.stats


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
    parser = argparse.ArgumentParser(
        description="Trigger scheduled autonomous Jules runs through the issue-backed bridge."
    )
    parser.add_argument("--repo", help="GitHub repo in owner/name format")
    parser.add_argument(
        "--cooldown-hours",
        type=float,
        default=18,
        help="Do not trigger if the tracker issue received a session comment more recently than this.",
    )
    parser.add_argument("--force", action="store_true", help="Ignore cooldown checks")
    parser.add_argument("--dry-run", action="store_true", help="Print intended changes only")
    return parser.parse_args()


def main():
    args = parse_args()
    repo = resolve_repo(args.repo)
    if not repo:
        print("Could not resolve repository. Set --repo or GITHUB_REPOSITORY.")
        return 1

    client = GitHubCLI(repo=repo, dry_run=args.dry_run)
    scheduler = AutonomousScheduler(
        client=client,
        cooldown=timedelta(hours=args.cooldown_hours),
        force=args.force,
    )
    stats = scheduler.run()

    print(
        "Summary: "
        f"issues_created={stats.issues_created}, "
        f"sessions_triggered={stats.sessions_triggered}, "
        f"skipped_for_open_prs={stats.skipped_for_open_prs}, "
        f"skipped_for_cooldown={stats.skipped_for_cooldown}, "
        f"errors={stats.errors}"
    )
    return 1 if stats.errors else 0


if __name__ == "__main__":
    sys.exit(main())
