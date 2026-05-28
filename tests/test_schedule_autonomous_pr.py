from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from unittest.mock import MagicMock, patch


MODULE_PATH = (
    Path(__file__).resolve().parents[1]
    / ".github"
    / "scripts"
    / "schedule_autonomous_pr.py"
)
SPEC = spec_from_file_location("schedule_autonomous_pr", MODULE_PATH)
schedule_autonomous_pr = module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(schedule_autonomous_pr)


def _set_env(monkeypatch):
    monkeypatch.setenv("GOOGLE_JULES_API", "fake_key")
    monkeypatch.setenv("GITHUB_REPOSITORY", "owner/repo")


def test_starts_session_with_fixed_prompt(monkeypatch):
    _set_env(monkeypatch)

    client = MagicMock()
    client.find_source_for_repo.return_value = "sources/github/owner/repo"
    client.create_session.return_value = {"name": "sessions/123"}

    with patch.object(schedule_autonomous_pr, "JulesClient", return_value=client):
        exit_code = schedule_autonomous_pr.main()

    assert exit_code == 0
    client.find_source_for_repo.assert_called_once_with("owner", "repo")
    client.create_session.assert_called_once_with(
        "sources/github/owner/repo",
        prompt=schedule_autonomous_pr.SCHEDULED_PROMPT,
        title=schedule_autonomous_pr.SCHEDULED_TITLE,
    )
    assert "AGENTS.md" in schedule_autonomous_pr.SCHEDULED_PROMPT


def test_errors_when_source_missing(monkeypatch):
    _set_env(monkeypatch)

    client = MagicMock()
    client.find_source_for_repo.return_value = None

    with patch.object(schedule_autonomous_pr, "JulesClient", return_value=client):
        exit_code = schedule_autonomous_pr.main()

    assert exit_code == 1
    client.create_session.assert_not_called()


def test_errors_when_api_key_missing(monkeypatch):
    monkeypatch.delenv("GOOGLE_JULES_API", raising=False)
    monkeypatch.setenv("GITHUB_REPOSITORY", "owner/repo")

    assert schedule_autonomous_pr.main() == 1


def test_errors_when_repo_missing(monkeypatch):
    monkeypatch.setenv("GOOGLE_JULES_API", "fake_key")
    monkeypatch.delenv("GITHUB_REPOSITORY", raising=False)

    assert schedule_autonomous_pr.main() == 1
