import unittest
from unittest.mock import MagicMock
import sys
import os

# Add the root directory to sys.path so we can import jules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from jules import JulesClient

class TestJulesClient(unittest.TestCase):
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
