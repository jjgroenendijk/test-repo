import sys
import re
import os

def extract_log_snippet(log_path):
    try:
        with open(log_path, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
    except FileNotFoundError:
        return "Log file not found."

    # Pattern to look for errors
    error_pattern = re.compile(r"(error|fail|exception|fatal)", re.IGNORECASE)

    match_index = -1
    for i, line in enumerate(lines):
        if error_pattern.search(line):
            match_index = i
            break

    if match_index != -1:
        start = max(0, match_index - 10)
        end = min(len(lines), match_index + 11)
        return "".join(lines[start:end])
    else:
        # Return last 20 lines if no specific error found
        return "".join(lines[-20:])

def generate_issue_body(log_path, pr_number, run_id, repo):
    snippet = extract_log_snippet(log_path)

    body = f"""The CI check failed for PR #{pr_number}.

**Log Snippet:**
```
{snippet}
```

[View Full Logs](https://github.com/{repo}/actions/runs/{run_id})
"""
    return body

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python3 extract_log.py <log_file> <pr_number> <run_id> <repo>")
        sys.exit(1)

    log_file = sys.argv[1]
    pr_num = sys.argv[2]
    run_id = sys.argv[3]
    repo = sys.argv[4]

    content = generate_issue_body(log_file, pr_num, run_id, repo)

    # Write to file
    with open("issue_body.md", "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Generated issue body for PR #{pr_num}")
