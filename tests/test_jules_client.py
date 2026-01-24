import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add the root directory to sys.path so we can import jules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from jules import JulesClient, JULES_API_BASE

class TestJulesClient(unittest.TestCase):
    def test_list_sources_pagination(self):
        client = JulesClient("fake_key")

        # Mock requests.get to return multiple pages
        with patch('requests.get') as mock_get:
            # Side effect for multiple calls
            mock_get.side_effect = [
                MagicMock(
                    status_code=200,
                    json=lambda: {
                        "sources": [{"name": "source1"}],
                        "nextPageToken": "token1"
                    }
                ),
                MagicMock(
                    status_code=200,
                    json=lambda: {
                        "sources": [{"name": "source2"}],
                        "nextPageToken": "token2"
                    }
                ),
                 MagicMock(
                    status_code=200,
                    json=lambda: {
                        "sources": [{"name": "source3"}]
                        # No nextPageToken
                    }
                )
            ]

            sources = client.list_sources()

            self.assertEqual(len(sources), 3)
            self.assertEqual(sources[0]["name"], "source1")
            self.assertEqual(sources[1]["name"], "source2")
            self.assertEqual(sources[2]["name"], "source3")

            self.assertEqual(mock_get.call_count, 3)
            # Verify params
            mock_get.assert_any_call(f"{JULES_API_BASE}/sources", headers=client.headers, params={})
            mock_get.assert_any_call(f"{JULES_API_BASE}/sources", headers=client.headers, params={'pageToken': 'token1'})
            mock_get.assert_any_call(f"{JULES_API_BASE}/sources", headers=client.headers, params={'pageToken': 'token2'})

    def test_find_source_for_repo(self):
        client = JulesClient("fake_key")

        # Mock list_sources
        client.list_sources = MagicMock(return_value=[
            {
                "githubRepo": {"owner": "TestOwner", "repo": "TestRepo"},
                "name": "sources/github/TestOwner/TestRepo"
            },
             {
                "githubRepo": {"owner": "OtherOwner", "repo": "OtherRepo"},
                "name": "sources/github/OtherOwner/OtherRepo"
            }
        ])

        # Test exact match
        self.assertEqual(client.find_source_for_repo("TestOwner", "TestRepo"), "sources/github/TestOwner/TestRepo")

        # Test case-insensitive match
        self.assertEqual(client.find_source_for_repo("testowner", "testrepo"), "sources/github/TestOwner/TestRepo")

        # Test mixed case match
        self.assertEqual(client.find_source_for_repo("TestOwner", "testREPO"), "sources/github/TestOwner/TestRepo")

        # Test no match
        self.assertIsNone(client.find_source_for_repo("NonExistent", "Repo"))

        # Test partial match (should fail)
        self.assertIsNone(client.find_source_for_repo("TestOwner", "OtherRepo"))

    def test_find_source_for_repo_missing_fields(self):
        client = JulesClient("fake_key")

        # Mock list_sources with missing fields
        client.list_sources = MagicMock(return_value=[
            {
                "githubRepo": {"owner": "TestOwner"}, # Missing repo
                "name": "sources/github/TestOwner/MissingRepo"
            },
             {
                "githubRepo": {"repo": "TestRepo"}, # Missing owner
                "name": "sources/github/MissingOwner/TestRepo"
            },
            {
                # Missing githubRepo
                "name": "sources/github/NoMetadata"
            }
        ])

        self.assertIsNone(client.find_source_for_repo("TestOwner", "TestRepo"))

if __name__ == '__main__':
    unittest.main()
