import sys
import re

def extract_log(log_path):
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
        end = min(len(lines), match_index + 11) # +11 because range is exclusive and we want 10 lines AFTER the match line
        return "".join(lines[start:end])
    else:
        # Return last 20 lines if no specific error found
        return "".join(lines[-20:])

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 extract_log.py <log_file>")
        sys.exit(1)
    print(extract_log(sys.argv[1]))
