import sys
import os
import unittest
from unittest.mock import patch, MagicMock

# Add root directory to sys.path to allow importing jules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from jules import JulesClient, JULES_API_BASE

class TestJulesClient(unittest.TestCase):
    @patch('jules.requests.post')
    def test_send_message(self, mock_post):
        # Setup
        api_key = "test_key"
        client = JulesClient(api_key)
        session_id = "sessions/12345"
        message = "Hello Jules"

        # Mock response
        mock_response = MagicMock()
        mock_response.json.return_value = {}
        mock_post.return_value = mock_response

        # Execute
        client.send_message(session_id, message)

        # Verify
        # The expected URL and payload as per official documentation
        expected_url = f"{JULES_API_BASE}/{session_id}:sendMessage"
        expected_payload = {"prompt": message}

        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args

        self.assertEqual(args[0], expected_url)
        self.assertEqual(kwargs['json'], expected_payload)
        self.assertEqual(kwargs['headers']['x-goog-api-key'], api_key)

if __name__ == '__main__':
    unittest.main()
