from datetime import datetime, timedelta, timezone
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


MODULE_PATH = (
    Path(__file__).resolve().parents[1] / ".github" / "scripts" / "schedule_autonomous_pr.py"
)
SPEC = spec_from_file_location("schedule_autonomous_pr", MODULE_PATH)
schedule_autonomous_pr = module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(schedule_autonomous_pr)


class FakeClient:
    def __init__(
        self,
        open_pr_numbers=None,
        issue_number=None,
        create_issue_number=501,
        comments=None,
        trigger_result=True,
    ):
        self.open_pr_numbers = open_pr_numbers or []
        self.issue_number = issue_number
        self.create_issue_number = create_issue_number
        self.comments = comments or []
        self.trigger_result = trigger_result

        self.created_issues = []
        self.triggered_sessions = []

    def list_open_pr_numbers(self):
        return self.open_pr_numbers

    def find_autonomous_issue(self):
        return self.issue_number

    def create_issue(self, title, body):
        self.created_issues.append((title, body))
        return self.create_issue_number

    def get_issue_comments(self, issue_number):
        return self.comments

    def trigger_jules_session(self, issue_number):
        self.triggered_sessions.append(issue_number)
        return self.trigger_result


def test_creates_issue_and_triggers_session_when_repo_is_idle():
    client = FakeClient(issue_number=None, create_issue_number=701)

    scheduler = schedule_autonomous_pr.AutonomousScheduler(
        client=client,
        cooldown=timedelta(hours=18),
    )
    stats = scheduler.run()

    assert stats.issues_created == 1
    assert stats.sessions_triggered == 1
    assert client.created_issues
    assert client.triggered_sessions == [701]


def test_skips_when_open_prs_exist():
    client = FakeClient(open_pr_numbers=[14], issue_number=701)

    scheduler = schedule_autonomous_pr.AutonomousScheduler(
        client=client,
        cooldown=timedelta(hours=18),
    )
    stats = scheduler.run()

    assert stats.skipped_for_open_prs == 1
    assert stats.sessions_triggered == 0
    assert client.triggered_sessions == []


def test_reuses_existing_issue_when_outside_cooldown():
    past_time = datetime.now(timezone.utc) - timedelta(hours=24)
    client = FakeClient(
        issue_number=808,
        comments=[
            {
                "body": "- **Session ID:** `sessions/123`",
                "created_at": past_time.isoformat(),
            }
        ],
    )

    scheduler = schedule_autonomous_pr.AutonomousScheduler(
        client=client,
        cooldown=timedelta(hours=18),
    )
    should_skip = scheduler.should_skip_for_cooldown(808)

    assert not should_skip

    stats = scheduler.run()

    assert stats.issues_created == 0
    assert stats.sessions_triggered == 1
    assert client.triggered_sessions == [808]


def test_skips_when_recent_session_comment_exists():
    recent_time = datetime.now(timezone.utc) - timedelta(hours=2)
    client = FakeClient(
        issue_number=909,
        comments=[
            {
                "body": "- **Session ID:** `sessions/999`",
                "created_at": recent_time.isoformat(),
            }
        ],
    )

    scheduler = schedule_autonomous_pr.AutonomousScheduler(
        client=client,
        cooldown=timedelta(hours=18),
    )
    should_skip = scheduler.should_skip_for_cooldown(909)

    assert should_skip

    stats = scheduler.run()

    assert stats.skipped_for_cooldown == 1
    assert stats.sessions_triggered == 0
    assert client.triggered_sessions == []


def test_force_bypasses_cooldown():
    recent_time = datetime.now(timezone.utc) - timedelta(hours=2)
    client = FakeClient(
        issue_number=1001,
        comments=[
            {
                "body": "- **Session ID:** `sessions/1001`",
                "created_at": recent_time.isoformat(),
            }
        ],
    )

    scheduler = schedule_autonomous_pr.AutonomousScheduler(
        client=client,
        cooldown=timedelta(hours=18),
        force=True,
    )
    stats = scheduler.run()

    assert stats.skipped_for_cooldown == 0
    assert stats.sessions_triggered == 1
    assert client.triggered_sessions == [1001]


def test_trigger_failure_increments_errors():
    client = FakeClient(issue_number=1101, trigger_result=False)

    scheduler = schedule_autonomous_pr.AutonomousScheduler(
        client=client,
        cooldown=timedelta(hours=18),
    )
    stats = scheduler.run()

    assert stats.errors == 1
    assert stats.sessions_triggered == 0
    assert client.triggered_sessions == [1101]
