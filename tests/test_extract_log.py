import unittest
import os
import tempfile
import sys
from io import StringIO

# Add the scripts directory to path to import extract_log
sys.path.append(os.path.join(os.path.dirname(__file__), '../.github/scripts'))

from extract_log import extract_log

class TestExtractLog(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.log_file = os.path.join(self.test_dir, "test.log")

    def tearDown(self):
        if os.path.exists(self.log_file):
            os.remove(self.log_file)
        os.rmdir(self.test_dir)

    def test_extract_error_context(self):
        content = []
        for i in range(50):
            content.append(f"Line {i}")
        content.append("Error: Something went wrong")
        for i in range(51, 100):
            content.append(f"Line {i}")

        with open(self.log_file, "w") as f:
            f.write("\n".join(content))

        snippet = extract_log(self.log_file)
        self.assertIn("Error: Something went wrong", snippet)
        # Should have context (approx 10 lines before and after)
        self.assertIn("Line 40", snippet)
        self.assertIn("Line 60", snippet)
        self.assertNotIn("Line 10", snippet) # Too far before
        self.assertNotIn("Line 90", snippet) # Too far after

    def test_no_error_returns_tail(self):
        content = []
        for i in range(100):
            content.append(f"Line {i}")

        with open(self.log_file, "w") as f:
            f.write("\n".join(content))

        snippet = extract_log(self.log_file)
        # Should return last 20 lines
        self.assertIn("Line 99", snippet)
        self.assertIn("Line 80", snippet)
        self.assertNotIn("Line 50", snippet)

    def test_missing_file(self):
        snippet = extract_log("nonexistent.log")
        self.assertEqual(snippet, "Log file not found.")

if __name__ == '__main__':
    unittest.main()
