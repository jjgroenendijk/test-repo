import unittest
from unittest.mock import MagicMock, patch
import sys
import os
import json
import tempfile

# Add root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import jules

class TestJulesIntegration(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.event_path = os.path.join(self.temp_dir.name, "event.json")

        # Default env vars
        self.env_patcher = patch.dict(os.environ, {
            "GOOGLE_JULES_API": "fake_key",
            "GITHUB_REPOSITORY": "TestOwner/TestRepo",
            "GITHUB_EVENT_PATH": self.event_path,
            "GITHUB_EVENT_NAME": "issues",
            "GITHUB_TOKEN": "fake_gh_token"
        })
        self.env_patcher.start()

    def tearDown(self):
        self.env_patcher.stop()
        self.temp_dir.cleanup()

    @patch('jules.requests.get')
    @patch('jules.requests.post')
    @patch('jules.run_command')
    def test_main_issue_opened(self, mock_run_command, mock_post, mock_get):
        # 1. Setup Event Data
        event_data = {
            "action": "opened",
            "issue": {
                "number": 101,
                "title": "Bug Report",
                "body": "Fix this bug please."
            }
        }
        with open(self.event_path, "w") as f:
            json.dump(event_data, f)

        # 2. Mock API Responses

        # list_sources (called by find_source_for_repo)
        mock_get.side_effect = [
            # First call: list_sources (page 1)
            MagicMock(
                status_code=200,
                json=lambda: {
                    "sources": [
                        {
                            "name": "sources/github/TestOwner/TestRepo",
                            "githubRepo": {"owner": "TestOwner", "repo": "TestRepo"}
                        }
                    ]
                }
            ),
             # Second call: get_session (verification)
            MagicMock(
                status_code=200,
                json=lambda: {"name": "sessions/new-session-id", "state": "running"}
            )
        ]

        # create_session
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"name": "sessions/new-session-id"}
        )

        # Mock gh command responses
        # get_default_branch calls "gh repo view"
        def run_command_side_effect(cmd):
            if cmd[:3] == ["gh", "repo", "view"]:
                return json.dumps({"defaultBranchRef": {"name": "main"}})
            if cmd[:3] == ["gh", "issue", "comment"]:
                return "Comment posted"
            return None

        mock_run_command.side_effect = run_command_side_effect

        # 3. Run Main
        jules.main()

        # 4. Verifications

        # Check find_source_for_repo was effectively called (implied by create_session call)

        # Check create_session payload
        expected_create_url = f"{jules.JULES_API_BASE}/sessions"
        mock_post.assert_called_with(
            expected_create_url,
            headers={'x-goog-api-key': 'fake_key', 'Content-Type': 'application/json'},
            json={
                "prompt": "Fix this bug please.",
                "sourceContext": {
                    "source": "sources/github/TestOwner/TestRepo",
                    "githubRepoContext": {
                        "startingBranch": "main"
                    }
                },
                "automationMode": "AUTO_CREATE_PR",
                "title": "Bug Report"
            }
        )

        # Check Success Comment
        expected_comment_cmd = [
            "gh", "issue", "comment", "101",
            "--body",
            "🚀 **Jules Session Started!**\n\nI have successfully created a session to work on this issue.\n- **Session ID:** `sessions/new-session-id`\n- **Prompt:** Bug Report\n\nI will now analyze the codebase and generate a plan. (Note: Future updates will appear here automatically when implemented)."
        ]
        # We need to verify that run_command was called with these arguments
        # Since run_command is called multiple times, we check if it was called with this specific command

        # Extract all calls to run_command
        calls = mock_run_command.call_args_list
        comment_call_found = False
        for call in calls:
            args, _ = call
            cmd_arg = args[0]
            if cmd_arg == expected_comment_cmd:
                comment_call_found = True
                break

        self.assertTrue(comment_call_found, "Success comment was not posted via gh CLI")

    @patch('jules.requests.get')
    @patch('jules.requests.post')
    @patch('jules.run_command')
    def test_main_workflow_dispatch(self, mock_run_command, mock_post, mock_get):
        # Update Env for workflow_dispatch
        self.env_patcher.stop() # stop previous patcher
        self.env_patcher = patch.dict(os.environ, {
            "GOOGLE_JULES_API": "fake_key",
            "GITHUB_REPOSITORY": "TestOwner/TestRepo",
            "GITHUB_EVENT_PATH": self.event_path,
            "GITHUB_EVENT_NAME": "workflow_dispatch",
            "GITHUB_TOKEN": "fake_gh_token"
        })
        self.env_patcher.start()

        # 1. Setup Event Data
        event_data = {
            "inputs": {
                "issue_number": "102"
            }
        }
        with open(self.event_path, "w") as f:
            json.dump(event_data, f)

        # 2. Mock API Responses

        # list_sources & get_session
        mock_get.side_effect = [
            # First call: list_sources (page 1)
            MagicMock(
                status_code=200,
                json=lambda: {
                    "sources": [
                        {
                            "name": "sources/github/TestOwner/TestRepo",
                            "githubRepo": {"owner": "TestOwner", "repo": "TestRepo"}
                        }
                    ]
                }
            ),
             # Second call: get_session (verification)
            MagicMock(
                status_code=200,
                json=lambda: {"name": "sessions/manual-session-id", "state": "running"}
            )
        ]

        # create_session
        mock_post.return_value = MagicMock(
            status_code=200,
            json=lambda: {"name": "sessions/manual-session-id"}
        )

        # Mock gh command responses
        def run_command_side_effect(cmd):
            # gh issue view 102 --json title,body,number
            if cmd[:4] == ["gh", "issue", "view", "102"]:
                 return json.dumps({
                     "title": "Manual Issue",
                     "body": "Do this manually.",
                     "number": 102
                 })

            if cmd[:3] == ["gh", "repo", "view"]:
                return json.dumps({"defaultBranchRef": {"name": "main"}})
            if cmd[:3] == ["gh", "issue", "comment"]:
                return "Comment posted"
            return None

        mock_run_command.side_effect = run_command_side_effect

        # 3. Run Main
        jules.main()

        # 4. Verifications

        # Check create_session payload
        expected_create_url = f"{jules.JULES_API_BASE}/sessions"
        mock_post.assert_called_with(
            expected_create_url,
            headers={'x-goog-api-key': 'fake_key', 'Content-Type': 'application/json'},
            json={
                "prompt": "Do this manually.",
                "sourceContext": {
                    "source": "sources/github/TestOwner/TestRepo",
                    "githubRepoContext": {
                        "startingBranch": "main"
                    }
                },
                "automationMode": "AUTO_CREATE_PR",
                "title": "Manual Issue"
            }
        )

        # Check Success Comment
        expected_comment_cmd = [
            "gh", "issue", "comment", "102",
            "--body",
            "🚀 **Jules Session Started!**\n\nI have successfully created a session to work on this issue.\n- **Session ID:** `sessions/manual-session-id`\n- **Prompt:** Manual Issue\n\nI will now analyze the codebase and generate a plan. (Note: Future updates will appear here automatically when implemented)."
        ]

        # Extract all calls to run_command
        calls = mock_run_command.call_args_list
        comment_call_found = False
        for call in calls:
            args, _ = call
            cmd_arg = args[0]
            if cmd_arg == expected_comment_cmd:
                comment_call_found = True
                break

        self.assertTrue(comment_call_found, "Success comment was not posted via gh CLI for workflow_dispatch")

if __name__ == '__main__':
    unittest.main()
