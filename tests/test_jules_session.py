import unittest
from unittest.mock import MagicMock, patch
import sys
import os
import json

# Add root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from jules import JulesClient, JULES_API_BASE

class TestJulesSession(unittest.TestCase):
    def setUp(self):
        self.client = JulesClient("fake_key")

    @patch('requests.post')
    @patch('requests.get')
    def test_create_session(self, mock_get, mock_post):
        # Mock create response
        mock_create_response = MagicMock()
        mock_create_response.json.return_value = {"name": "sessions/123"}
        mock_create_response.status_code = 200

        # Mock get response (verification)
        mock_get_response = MagicMock()
        mock_get_response.json.return_value = {"name": "sessions/123", "state": "running"}
        mock_get_response.status_code = 200

        mock_post.return_value = mock_create_response
        mock_get.return_value = mock_get_response

        # Call method
        session = self.client.create_session("sources/github/owner/repo", "Test Prompt", "Test Title")

        # Verify create call
        expected_url = f"{JULES_API_BASE}/sessions"
        expected_payload = {
            "prompt": "Test Prompt",
            "sourceContext": {
                "source": "sources/github/owner/repo",
                "githubRepoContext": {
                    "startingBranch": "main"
                }
            },
            "automationMode": "AUTO_CREATE_PR",
            "title": "Test Title"
        }

        mock_post.assert_called_with(expected_url, headers=self.client.headers, json=expected_payload)

        # Verify get call (which will be added in Step 2)
        # Note: If I run this test against current code, it will fail on this assertion if I uncomment it.
        # But since I'm implementing TDD, I'll expect the get call.
        # However, since I can't change code yet, I'll comment out the get assertion or accept failure?
        # I'll include it.
        expected_get_url = f"{JULES_API_BASE}/sessions/123"
        mock_get.assert_called_with(expected_get_url, headers=self.client.headers)

        self.assertEqual(session, {"name": "sessions/123"})

    @patch('requests.post')
    def test_send_message(self, mock_post):
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_response.status_code = 200
        mock_post.return_value = mock_response

        session_id = "sessions/123"
        message = "Hello"

        self.client.send_message(session_id, message)

        # Expect corrected URL and Payload
        expected_url = f"{JULES_API_BASE}/{session_id}:sendMessage"
        expected_payload = {
            "prompt": message
        }

        mock_post.assert_called_with(expected_url, headers=self.client.headers, json=expected_payload)

if __name__ == '__main__':
    unittest.main()
