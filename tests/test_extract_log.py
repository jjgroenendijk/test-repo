import os
import pytest
from importlib.machinery import SourceFileLoader

# Load the script as a module since it doesn't have a .py extension in the import path easily
# or simply append path.
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../.github/scripts'))

# We need to import it carefully.
extract_log = SourceFileLoader("extract_log", ".github/scripts/extract_log.py").load_module()

def test_extract_log_snippet_found(tmp_path):
    log_file = tmp_path / "test.log"
    content = ["Line {}\n".format(i) for i in range(50)]
    content[25] = "Error: something bad happened\n"
    log_file.write_text("".join(content), encoding="utf-8")

    snippet = extract_log.extract_log_snippet(str(log_file))

    assert "Error: something bad happened" in snippet
    assert "Line 15" in snippet # 10 lines before
    assert "Line 35" in snippet # 10 lines after
    assert "Line 10" not in snippet

def test_extract_log_snippet_not_found(tmp_path):
    log_file = tmp_path / "test.log"
    content = ["Line {}\n".format(i) for i in range(50)]
    log_file.write_text("".join(content), encoding="utf-8")

    snippet = extract_log.extract_log_snippet(str(log_file))

    assert "Line 49" in snippet
    assert "Line 30" in snippet
    assert "Line 10" not in snippet

def test_generate_issue_body(tmp_path):
    log_file = tmp_path / "test.log"
    log_file.write_text("Error: boom", encoding="utf-8")

    body = extract_log.generate_issue_body(str(log_file), "123", "999", "owner/repo")

    assert "PR #123" in body
    assert "Error: boom" in body
    assert "owner/repo/actions/runs/999" in body
