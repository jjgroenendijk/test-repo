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


@patch("jules.post_issue_comment")
def test_start_issue_session_wraps_issue_body_with_autonomy_prompt(
    mock_post_issue_comment,
):
    client = MagicMock()
    client.find_source_for_repo.return_value = "sources/github/owner/repo"
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
    assert "Never ask the user any questions under any circumstance" in kwargs["prompt"]
    assert "Never ask the user for validation" in kwargs["prompt"]
    assert "decide what you think is the best option" in kwargs["prompt"]
    assert "continue with the safest local fallback" in kwargs["prompt"]
    assert "Issue title: SpotiFLAC Queue UX" in kwargs["prompt"]
    assert "Prepare the first SpotiFLAC web UI backlog slice." in kwargs["prompt"]
