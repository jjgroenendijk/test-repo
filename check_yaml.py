import yaml
import sys

try:
    with open('.github/workflows/report_failure.yml', 'r') as f:
        yaml.safe_load(f)
    print("YAML is valid")
except Exception as e:
    print(f"YAML error: {e}")
