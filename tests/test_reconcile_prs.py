from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / ".github" / "scripts" / "reconcile_prs.py"
SPEC = spec_from_file_location("reconcile_prs", MODULE_PATH)
reconcile_prs = module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(reconcile_prs)


class FakeClient:
    def __init__(
        self,
        pr,
        checks,
        merge_result=False,
        existing_issue=None,
        has_session=False,
        trigger_result=True,
    ):
        self.pr = pr
        self.checks = checks
        self.merge_result = merge_result
        self.existing_issue = existing_issue
        self.has_session = has_session
        self.trigger_result = trigger_result

        self.merged = []
        self.created_issues = []
        self.triggered_sessions = []
        self.open_issue_numbers_for_pr = []
        self.closed_issues = []
        self.issue_states = {}
        self.automation_issues = []

    def list_open_pr_numbers(self):
        return [self.pr["number"]]

    def get_pr(self, pr_number):
        if pr_number != self.pr["number"]:
            return None
        return self.pr

    def get_pr_checks(self, pr_number):
        return self.checks

    def merge_pr(self, pr_number):
        self.merged.append(pr_number)
        return self.merge_result

    def find_open_issue_by_title(self, title):
        return self.existing_issue

    def create_issue(self, title, body):
        self.created_issues.append((title, body))
        return 999

    def issue_has_jules_session(self, issue_number):
        return self.has_session

    def get_issue_jules_state(self, issue_number):
        return self.issue_states.get(issue_number, reconcile_prs.IssueJulesState())

    def trigger_jules_session(self, issue_number):
        self.triggered_sessions.append(issue_number)
        return self.trigger_result

    def find_open_issue_numbers_for_pr(self, pr_number):
        return self.open_issue_numbers_for_pr

    def close_issue(self, issue_number, reason):
        self.closed_issues.append((issue_number, reason))
        return True

    def list_open_automation_issues(self):
        return self.automation_issues

    def drop_issue_from_cache(self, issue_number):
        return None


def test_blocking_checks_detects_non_passing_states():
    checks = [
        {"name": "lint", "state": "SUCCESS"},
        {"name": "tests", "state": "FAILURE"},
        {"name": "e2e", "state": "PENDING"},
    ]

    blocked = reconcile_prs.blocking_checks(checks)

    assert [check["name"] for check in blocked] == ["tests"]


def test_pending_checks_detects_pending_states():
    checks = [
        {"name": "lint", "state": "SUCCESS"},
        {"name": "tests", "state": "FAILURE"},
        {"name": "e2e", "state": "PENDING"},
        {"name": "build", "state": "QUEUED"},
    ]

    pending = reconcile_prs.pending_checks(checks)

    assert [check["name"] for check in pending] == ["e2e", "build"]


def test_pending_pr_is_skipped():
    client = FakeClient(
        pr={
            "number": 10,
            "title": "Pending checks",
            "url": "https://example/pr/10",
            "mergeable": "MERGEABLE",
            "isDraft": False,
            "state": "OPEN",
        },
        checks=[{"name": "ci", "state": "QUEUED"}],
    )

    reconciler = reconcile_prs.PrReconciler(client)
    reconciler.reconcile_pr(10)

    assert reconciler.stats.merged == 0
    assert not client.created_issues
    assert not client.triggered_sessions


def test_conflicting_pr_creates_issue_and_triggers_jules():
    client = FakeClient(
        pr={
            "number": 42,
            "title": "Fix downloader",
            "url": "https://example/pr/42",
            "mergeable": "CONFLICTING",
            "isDraft": False,
            "state": "OPEN",
        },
        checks=[],
        existing_issue=None,
    )

    reconciler = reconcile_prs.PrReconciler(client)
    reconciler.reconcile_pr(42)

    assert reconciler.stats.issues_created == 1
    assert reconciler.stats.sessions_triggered == 1
    assert client.created_issues
    assert client.triggered_sessions == [999]


def test_existing_issue_without_session_triggers_jules():
    client = FakeClient(
        pr={
            "number": 7,
            "title": "Refactor",
            "url": "https://example/pr/7",
            "mergeable": "MERGEABLE",
            "isDraft": False,
            "state": "OPEN",
        },
        checks=[{"name": "ci", "state": "FAILURE"}],
        existing_issue=123,
        has_session=False,
    )
    client.open_issue_numbers_for_pr = [123]

    reconciler = reconcile_prs.PrReconciler(client)
    reconciler.reconcile_pr(7)

    assert reconciler.stats.sessions_triggered == 1
    assert client.triggered_sessions == [123]


def test_session_trigger_failure_increments_errors():
    client = FakeClient(
        pr={
            "number": 21,
            "title": "Fix CI",
            "url": "https://example/pr/21",
            "mergeable": "MERGEABLE",
            "isDraft": False,
            "state": "OPEN",
        },
        checks=[{"name": "ci", "state": "FAILURE"}],
        existing_issue=555,
        has_session=False,
        trigger_result=False,
    )
    client.open_issue_numbers_for_pr = [555]

    reconciler = reconcile_prs.PrReconciler(client)
    reconciler.reconcile_pr(21)

    assert reconciler.stats.sessions_triggered == 0
    assert reconciler.stats.errors == 1
    assert client.triggered_sessions == [555]


def test_mergeable_and_passing_pr_is_merged():
    client = FakeClient(
        pr={
            "number": 9,
            "title": "Improve docs",
            "url": "https://example/pr/9",
            "mergeable": "MERGEABLE",
            "isDraft": False,
            "state": "OPEN",
        },
        checks=[{"name": "ci", "state": "SUCCESS"}],
        merge_result=True,
    )

    reconciler = reconcile_prs.PrReconciler(client)
    reconciler.reconcile_pr(9)

    assert reconciler.stats.merged == 1
    assert client.merged == [9]
    assert not client.created_issues


def test_merge_success_closes_linked_issues():
    client = FakeClient(
        pr={
            "number": 12,
            "title": "Resolve conflict",
            "url": "https://example/pr/12",
            "mergeable": "MERGEABLE",
            "isDraft": False,
            "state": "OPEN",
        },
        checks=[{"name": "ci", "state": "SUCCESS"}],
        merge_result=True,
    )
    client.open_issue_numbers_for_pr = [201, 202]

    reconciler = reconcile_prs.PrReconciler(client)
    reconciler.reconcile_pr(12)

    assert reconciler.stats.issues_closed == 2
    assert [issue for issue, _ in client.closed_issues] == [201, 202]


def test_non_open_pr_closes_linked_issues_without_merge_attempt():
    client = FakeClient(
        pr={
            "number": 88,
            "title": "Already merged",
            "url": "https://example/pr/88",
            "mergeable": "UNKNOWN",
            "isDraft": False,
            "state": "MERGED",
        },
        checks=[],
        merge_result=False,
    )
    client.open_issue_numbers_for_pr = [303]

    reconciler = reconcile_prs.PrReconciler(client)
    reconciler.reconcile_pr(88)

    assert reconciler.stats.merged == 0
    assert reconciler.stats.issues_closed == 1
    assert client.merged == []
    assert client.closed_issues and client.closed_issues[0][0] == 303


def test_queued_issue_retries_when_queue_comment_is_stale():
    client = FakeClient(
        pr={
            "number": 13,
            "title": "Fix queued automation",
            "url": "https://example/pr/13",
            "mergeable": "MERGEABLE",
            "isDraft": False,
            "state": "OPEN",
        },
        checks=[{"name": "ci", "state": "FAILURE"}],
        existing_issue=413,
        has_session=False,
    )
    client.open_issue_numbers_for_pr = [413]
    client.issue_states[413] = reconcile_prs.IssueJulesState(
        queued=True,
        last_queue_comment_at=reconcile_prs.datetime.now(reconcile_prs.timezone.utc)
        - reconcile_prs.QUEUE_RETRY_INTERVAL
        - reconcile_prs.timedelta(minutes=5),
    )

    reconciler = reconcile_prs.PrReconciler(client)
    reconciler.reconcile_pr(13)

    assert client.triggered_sessions == [413]
    assert reconciler.stats.sessions_triggered == 1


def test_duplicate_automation_issues_are_closed_during_recovery():
    client = FakeClient(
        pr={
            "number": 51,
            "title": "Conflicting PR",
            "url": "https://example/pr/51",
            "mergeable": "CONFLICTING",
            "isDraft": False,
            "state": "OPEN",
        },
        checks=[],
        existing_issue=601,
        has_session=False,
    )
    client.automation_issues = [
        {"number": 601, "title": "Merge Conflict: PR #51", "body": ""},
        {"number": 602, "title": "Merge Conflict: PR #51", "body": ""},
    ]
    client.issue_states[601] = reconcile_prs.IssueJulesState(has_session=True)
    client.issue_states[602] = reconcile_prs.IssueJulesState()

    reconciler = reconcile_prs.PrReconciler(client)
    reconciler.reconcile()

    assert reconciler.stats.issues_closed == 1
    assert client.closed_issues == [
        (
            602,
            "Closing automatically as a duplicate automation issue for PR #51. "
            "Issue #601 remains the canonical tracker.",
        )
    ]


def test_closed_pr_canonical_automation_issue_is_closed_during_recovery():
    client = FakeClient(
        pr={
            "number": 71,
            "title": "Merged already",
            "url": "https://example/pr/71",
            "mergeable": "UNKNOWN",
            "isDraft": False,
            "state": "MERGED",
        },
        checks=[],
        merge_result=False,
    )
    client.automation_issues = [
        {"number": 701, "title": "CI Failure: PR #71", "body": "<!-- pr-automation:pr=71 -->"}
    ]

    reconciler = reconcile_prs.PrReconciler(client)
    reconciler.recover_automation_issues(processed_pr_numbers=set())

    assert client.closed_issues == [
        (701, "Closing automatically because PR #71 is no longer open.")
    ]
