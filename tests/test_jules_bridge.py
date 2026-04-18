import os
import sys
from unittest.mock import MagicMock, patch


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import jules


def test_extract_session_id_from_comments():
    comments = [
        {"body": "No session here"},
        {"body": "🚀 **Jules Session Started!**\n- **Session ID:** `sessions/123`"},
    ]

    assert jules.extract_session_id_from_comments(comments) == "sessions/123"


def test_is_session_busy_only_for_non_terminal_states():
    assert jules.is_session_busy({"state": "IN_PROGRESS"})
    assert jules.is_session_busy({"state": "queued"})
    assert not jules.is_session_busy({"state": "COMPLETED"})
    assert not jules.is_session_busy({"state": "FAILED"})


@patch("jules.post_issue_comment")
@patch("jules.issue_has_queue_comment", return_value=False)
def test_queue_issue_posts_single_queue_comment(
    mock_has_queue_comment, mock_post_issue_comment
):
    jules.queue_issue(
        42,
        {
            "name": "sessions/999",
            "state": "IN_PROGRESS",
            "url": "https://example.com/session/999",
        },
    )

    mock_has_queue_comment.assert_called_once_with(42, comments=None)
    mock_post_issue_comment.assert_called_once()
    body = mock_post_issue_comment.call_args.args[1]
    assert "sessions/999" in body
    assert jules.QUEUE_MARKER in body


@patch(
    "jules.list_open_issues",
    return_value=[
        {
            "number": 1,
            "title": "Foreign issue",
            "body": "body",
            "author_login": "someone-else",
            "comments": [],
        },
        {
            "number": 2,
            "title": "Has session",
            "body": "body",
            "author_login": "owner",
            "comments": [{"body": "**Session ID:** `sessions/existing`"}],
        },
        {
            "number": 3,
            "title": "Next pending",
            "body": "body",
            "author_login": "owner",
            "comments": [],
        },
    ],
)
def test_find_next_pending_issue_skips_issues_with_existing_sessions(
    mock_list_open_issues,
):
    issue = jules.find_next_pending_issue("owner/repo", "owner")

    assert issue == {
        "number": 3,
        "title": "Next pending",
        "body": "body",
        "author_login": "owner",
        "comments": [],
    }
    mock_list_open_issues.assert_called_once_with("owner/repo")


@patch("jules.post_issue_comment")
def test_start_issue_session_wraps_issue_body_with_autonomy_prompt(
    mock_post_issue_comment,
):
    client = MagicMock()
    client.find_source_for_repo.return_value = "sources/github/owner/repo"
    client.find_busy_session_for_source.return_value = None
    client.create_session.return_value = {"name": "sessions/123"}

    exit_code = jules.start_issue_session(
        client,
        7,
        "SpotiFLAC Queue UX",
        "Prepare the first SpotiFLAC web UI backlog slice.",
        "owner",
        "repo",
        "owner/repo",
    )

    assert exit_code == 0
    client.create_session.assert_called_once()
    args, kwargs = client.create_session.call_args
    assert args[0] == "sources/github/owner/repo"
    assert kwargs["title"] == "SpotiFLAC Queue UX"
    assert "Never ask the user for plan approval" in kwargs["prompt"]
    assert "Issue title: SpotiFLAC Queue UX" in kwargs["prompt"]
    assert "Prepare the first SpotiFLAC web UI backlog slice." in kwargs["prompt"]
