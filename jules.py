#/// script
# dependencies = [
#   "requests",
# ]
#///

import os
import sys
import json
import subprocess
import requests

JULES_API_BASE = "https://jules.googleapis.com/v1alpha"

class JulesClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json"
        }

    def list_sources(self):
        """List all available sources."""
        url = f"{JULES_API_BASE}/sources"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json().get("sources", [])

    def find_source_for_repo(self, repo_owner, repo_name):
        """Find the Jules source ID for a specific GitHub repo."""
        sources = self.list_sources()
        # Look for a match in the source metadata
        # Structure: {"githubRepo": {"owner": "...", "repo": "..."}}
        for source in sources:
            gh_repo = source.get("githubRepo", {})
            if (gh_repo.get("owner").lower() == repo_owner.lower() and
                gh_repo.get("repo").lower() == repo_name.lower()):
                return source.get("name") # e.g., "sources/github/owner/repo"
        return None

    def create_session(self, source_name, prompt, title, branch="main"):
        """Create a new Jules session."""
        url = f"{JULES_API_BASE}/sessions"
        payload = {
            "prompt": prompt,
            "sourceContext": {
                "source": source_name,
                "githubRepoContext": {
                    "startingBranch": branch
                }
            },
            "automationMode": "AUTO_CREATE_PR",
            "title": title
        }

        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()

def run_command(command):
    """Run a shell command and return the output."""
    try:
        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {command}")
        print(f"Stderr: {e.stderr}")
        return None

def get_default_branch():
    """Get the default branch of the repository using gh CLI."""
    # We rely on gh CLI being available and authenticated
    try:
        # gh repo view --json defaultBranchRef -q .defaultBranchRef.name
        branch = run_command(["gh", "repo", "view", "--json", "defaultBranchRef", "-q", ".defaultBranchRef.name"])
        if branch:
            return branch
    except Exception as e:
        print(f"Warning: Could not detect default branch: {e}")
    return "main"

def get_event_data():
    """Read and parse the GitHub event data."""
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        return None
    try:
        with open(event_path, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def main():
    print("Starting Jules Agent Bridge...")

    # 1. Configuration & Auth
    jules_api_key = os.environ.get("GOOGLE_JULES_API")
    if not jules_api_key:
        print("Error: GOOGLE_JULES_API is not set.")
        sys.exit(1)

    # Ensure GitHub Token for commenting
    if "GITHUB_TOKEN" not in os.environ and "GH_TOKEN" not in os.environ:
        if "GITHUB_PAT" in os.environ:
             os.environ["GITHUB_TOKEN"] = os.environ["GITHUB_PAT"]

    # 2. Parse Event
    event_data = get_event_data()
    if not event_data:
        print("No event data found. Exiting.")
        sys.exit(1)

    event_name = os.environ.get("GITHUB_EVENT_NAME")
    action = event_data.get("action")

    if event_name == "issue_comment" and action == "created":
        print("User comment received. Continuing session not yet implemented (API unknown).")
        # TODO: Implement session continuation
        sys.exit(0)

    if action != "opened":
        print(f"Skipping action: {action}")
        sys.exit(0)

    issue = event_data.get("issue", {})
    issue_number = issue.get("number")
    title = issue.get("title")
    body = issue.get("body")
    user = issue.get("user", {}).get("login")

    # Get current repo info from Env (Standard GitHub Actions env var)
    # GITHUB_REPOSITORY is "owner/repo"
    full_repo = os.environ.get("GITHUB_REPOSITORY")
    if not full_repo:
        print("Error: GITHUB_REPOSITORY not set.")
        sys.exit(1)

    owner, repo_name = full_repo.split("/")

    print(f"Processing Issue #{issue_number}: {title} (Repo: {full_repo})")

    # 3. Connect to Jules API
    client = JulesClient(jules_api_key)

    try:
        # Find Source
        print("Locating Jules Source...")
        source_name = client.find_source_for_repo(owner, repo_name)

        if not source_name:
            print(f"Error: No Jules source found for {full_repo}. Has the Jules GitHub App been installed?")
            # Post error comment
            err_msg = f"⚠️ I could not start a session because this repository (`{full_repo}`) is not connected to Jules."
            run_command(["gh", "issue", "comment", str(issue_number), "--body", err_msg])
            sys.exit(1)

        # Create Session
        default_branch = get_default_branch()
        print(f"Creating Session with Source: {source_name} on branch: {default_branch}")
        session = client.create_session(source_name, prompt=body, title=title, branch=default_branch)
        session_id = session.get("name") # e.g. "sessions/12345"

        # 4. Post Success Comment
        print(f"Session Created: {session_id}")

        comment_body = (
            f"🚀 **Jules Session Started!**\n\n"
            f"I have successfully created a session to work on this issue.\n"
            f"- **Session ID:** `{session_id}`\n"
            f"- **Prompt:** {title}\n\n"
            f"I will now analyze the codebase and generate a plan. "
            f"(Note: Future updates will appear here automatically when implemented)."
        )

        run_command(["gh", "issue", "comment", str(issue_number), "--body", comment_body])

    except Exception as e:
        print(f"An error occurred: {e}")
        # Try to post error
        run_command(["gh", "issue", "comment", str(issue_number), "--body", f"❌ An error occurred while starting Jules: {e}"])
        sys.exit(1)

if __name__ == "__main__":
    main()
