import os
import sys
from unittest.mock import patch


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


def test_is_repo_owner_matches_case_insensitively():
    assert jules.is_repo_owner("JjGroenendijk", "jjgroenendijk")
    assert not jules.is_repo_owner("someone-else", "jjgroenendijk")


@patch("jules.post_issue_comment")
@patch("jules.issue_has_queue_comment", return_value=False)
def test_queue_issue_posts_single_queue_comment(mock_has_queue_comment, mock_post_issue_comment):
    jules.queue_issue(
        42,
        {
            "name": "sessions/999",
            "state": "IN_PROGRESS",
            "url": "https://example.com/session/999",
        },
    )

    mock_has_queue_comment.assert_called_once_with(42)
    mock_post_issue_comment.assert_called_once()
    body = mock_post_issue_comment.call_args.args[1]
    assert "sessions/999" in body
    assert jules.QUEUE_MARKER in body


@patch("jules.find_session_id", side_effect=["sessions/existing", None])
@patch(
    "jules.list_open_issues",
    return_value=[
        {"number": 1, "title": "Foreign issue", "body": "body", "author_login": "someone-else"},
        {"number": 2, "title": "Has session", "body": "body", "author_login": "owner"},
        {"number": 3, "title": "Next pending", "body": "body", "author_login": "owner"},
    ],
)
def test_find_next_pending_issue_skips_issues_with_existing_sessions(mock_list_open_issues, mock_find_session_id):
    issue = jules.find_next_pending_issue("owner/repo", "owner")

    assert issue == {
        "number": 3,
        "title": "Next pending",
        "body": "body",
        "author_login": "owner",
    }
    mock_list_open_issues.assert_called_once_with("owner/repo")
    assert mock_find_session_id.call_count == 2
