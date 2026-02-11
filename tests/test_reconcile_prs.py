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
    ):
        self.pr = pr
        self.checks = checks
        self.merge_result = merge_result
        self.existing_issue = existing_issue
        self.has_session = has_session

        self.merged = []
        self.created_issues = []
        self.triggered_sessions = []

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

    def trigger_jules_session(self, issue_number):
        self.triggered_sessions.append(issue_number)
        return True


def test_blocking_checks_detects_non_passing_states():
    checks = [
        {"name": "lint", "state": "SUCCESS"},
        {"name": "tests", "state": "FAILURE"},
        {"name": "e2e", "state": "PENDING"},
    ]

    blocked = reconcile_prs.blocking_checks(checks)

    assert [check["name"] for check in blocked] == ["tests", "e2e"]


def test_conflicting_pr_creates_issue():
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
    assert client.created_issues
    assert not client.triggered_sessions


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

    reconciler = reconcile_prs.PrReconciler(client)
    reconciler.reconcile_pr(7)

    assert reconciler.stats.sessions_triggered == 1
    assert client.triggered_sessions == [123]


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
