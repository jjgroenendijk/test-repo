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
import re

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
        sources = []
        url = f"{JULES_API_BASE}/sources"
        params = {}

        while True:
            response = requests.get(url, headers=self.headers, params=params.copy())
            response.raise_for_status()
            data = response.json()

            page_sources = data.get("sources", [])
            sources.extend(page_sources)
            print(f"Fetched {len(page_sources)} sources.")

            next_page_token = data.get("nextPageToken")
            if not next_page_token:
                break
            params["pageToken"] = next_page_token

        print(f"Total sources found: {len(sources)}")
        return sources

    def find_source_for_repo(self, repo_owner, repo_name):
        """Find the Jules source ID for a specific GitHub repo."""
        sources = self.list_sources()
        # Look for a match in the source metadata
        # Structure: {"githubRepo": {"owner": "...", "repo": "..."}}
        target_owner = repo_owner.lower()
        target_repo = repo_name.lower()

        for source in sources:
            gh_repo = source.get("githubRepo", {})
            owner = gh_repo.get("owner")
            repo = gh_repo.get("repo")

            if owner and repo and \
               owner.lower() == target_owner and \
               repo.lower() == target_repo:
                return source.get("name") # e.g., "sources/github/owner/repo"
        return None

    def get_default_branch(self):
        """Get the default branch of the repository."""
        print("Fetching default branch...")
        cmd = ["gh", "repo", "view", "--json", "defaultBranchRef"]
        output = run_command(cmd)
        if output:
            try:
                data = json.loads(output)
                branch = data.get("defaultBranchRef", {}).get("name")
                if branch:
                    print(f"Default branch identified: {branch}")
                    return branch
            except json.JSONDecodeError:
                print("Error parsing default branch JSON")

        print("Warning: Could not determine default branch. Defaulting to 'main'.")
        return "main"

    def create_session(self, source_name, prompt, title):
        """Create a new Jules session."""
        starting_branch = self.get_default_branch()

        url = f"{JULES_API_BASE}/sessions"
        payload = {
            "prompt": prompt,
            "sourceContext": {
                "source": source_name,
                "githubRepoContext": {
                    "startingBranch": starting_branch
                }
            },
            "automationMode": "AUTO_CREATE_PR",
            "title": title
        }

        print(f"Creating session with payload: {json.dumps(payload, indent=2)}")
        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        session = response.json()

        # Verify persistence
        session_id = session.get("name")
        if session_id:
            print(f"Verifying session {session_id}...")
            try:
                self.get_session(session_id)
                print("Session verification successful.")
            except Exception as e:
                print(f"Warning: Session created but verification failed: {e}")

        return session

    def get_session(self, session_id):
        """Get session details."""
        url = f"{JULES_API_BASE}/{session_id}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def send_message(self, session_id, message):
        """Send a message to an existing Jules session."""
        url = f"{JULES_API_BASE}/{session_id}:sendMessage"
        payload = {
            "prompt": message
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

def find_session_id(issue_number):
    """Find the Jules Session ID from the issue comments."""
    # Use gh to get comments
    # gh issue view <number> --json comments
    cmd = ["gh", "issue", "view", str(issue_number), "--json", "comments"]
    output = run_command(cmd)
    if not output:
        return None

    try:
        data = json.loads(output)
        comments = data.get("comments", [])
        pattern = re.compile(r"\*\*Session ID:\*\* `(sessions/[^`]+)`")
        for comment in comments:
            body = comment.get("body", "")
            # Look for "- **Session ID:** `sessions/12345`"
            match = pattern.search(body)
            if match:
                return match.group(1)
    except json.JSONDecodeError:
        print("Error parsing comments JSON")

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

    if event_name == "workflow_dispatch":
        print("Triggered by workflow_dispatch")
        inputs = event_data.get("inputs", {})
        issue_number = inputs.get("issue_number")
        if not issue_number:
            print("Error: issue_number input missing.")
            sys.exit(1)

        # Fetch issue details
        print(f"Fetching details for issue #{issue_number}")
        cmd = ["gh", "issue", "view", str(issue_number), "--json", "title,body,number"]
        output = run_command(cmd)
        if not output:
             print(f"Error: Could not fetch details for issue #{issue_number}")
             sys.exit(1)

        try:
             issue_data = json.loads(output)
             title = issue_data.get("title")
             body = issue_data.get("body")
             # Ensure issue_number is int if needed, though we used string in cmd
        except json.JSONDecodeError:
             print("Error parsing issue details JSON")
             sys.exit(1)

        action = "opened" # Simulate opened event
    else:
        action = event_data.get("action")
        if action not in ["opened", "created"]:
            print(f"Skipping action: {action}")
            sys.exit(0)

        issue = event_data.get("issue", {})
        issue_number = issue.get("number")
        title = issue.get("title")
        body = issue.get("body")
    # user = issue.get("user", {}).get("login")

    # Get current repo info from Env (Standard GitHub Actions env var)
    # GITHUB_REPOSITORY is "owner/repo"
    full_repo = os.environ.get("GITHUB_REPOSITORY")
    if not full_repo:
        print("Error: GITHUB_REPOSITORY not set.")
        sys.exit(1)

    owner, repo_name = full_repo.split("/")

    # 3. Connect to Jules API
    client = JulesClient(jules_api_key)

    if action == "created" and "comment" in event_data:
        # Handle New Comment
        comment = event_data.get("comment", {})
        comment_body = comment.get("body")
        sender = event_data.get("sender", {}).get("login")

        print(f"Processing Comment on Issue #{issue_number} by {sender}")

        if sender == "github-actions[bot]":
            print("Ignoring comment from bot.")
            sys.exit(0)

        session_id = find_session_id(issue_number)
        if not session_id:
            print("No active Jules session found for this issue.")
            sys.exit(0)

        print(f"Forwarding comment to Session: {session_id}")
        try:
            client.send_message(session_id, comment_body)
            print("Comment forwarded successfully.")
        except Exception as e:
            print(f"Error forwarding comment: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response Text: {e.response.text}")
            sys.exit(1)

    elif action == "opened":
        print(f"Processing New Issue #{issue_number}: {title} (Repo: {full_repo})")

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
            print(f"Creating Session with Source: {source_name}")
            session = client.create_session(source_name, prompt=body or "", title=title)
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
            # Capture response text for detailed logging
            response_text = ""
            if hasattr(e, 'response') and e.response is not None:
                response_text = f"\nAPI Error: {e.response.text}"
                print(f"Response Text: {e.response.text}")

            # Try to post error
            try:
                run_command(["gh", "issue", "comment", str(issue_number), "--body", f"❌ An error occurred while starting Jules: {e}{response_text}"])
            except Exception as comment_err:
                print(f"Error posting failure comment: {comment_err}")
            sys.exit(1)

if __name__ == "__main__":
    main()
