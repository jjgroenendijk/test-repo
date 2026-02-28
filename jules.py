#/// script
# dependencies = [
#   "requests",
# ]
#///

import json
import os
import re
import subprocess
import sys

import requests

JULES_API_BASE = "https://jules.googleapis.com/v1alpha"
SESSION_ID_PATTERN = re.compile(r"\*\*Session ID:\*\* `(sessions/[^`]+)`")
QUEUE_MARKER = "<!-- jules-queue -->"
BUSY_SESSION_STATES = {
    "QUEUED",
    "PLANNING",
    "AWAITING_PLAN_APPROVAL",
    "AWAITING_USER_FEEDBACK",
    "IN_PROGRESS",
    "PAUSED",
}


def is_session_busy(session):
    """Return True when a session still occupies the repo's only active slot."""
    return str(session.get("state") or "").upper() in BUSY_SESSION_STATES


class JulesClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
        }

    def list_sources(self):
        """List all available sources."""
        url = f"{JULES_API_BASE}/sources"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json().get("sources", [])

    def list_sessions(self, filter_expression="archived = false", page_size=100):
        """List available Jules sessions."""
        url = f"{JULES_API_BASE}/sessions"
        params = {"pageSize": page_size}
        if filter_expression:
            params["filter"] = filter_expression
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json().get("sessions", [])

    def find_source_for_repo(self, repo_owner, repo_name):
        """Find the Jules source ID for a specific GitHub repo."""
        sources = self.list_sources()
        target_owner = repo_owner.lower()
        target_repo = repo_name.lower()

        for source in sources:
            gh_repo = source.get("githubRepo", {})
            owner = gh_repo.get("owner")
            repo = gh_repo.get("repo")

            if owner and repo and owner.lower() == target_owner and repo.lower() == target_repo:
                return source.get("name")
        return None

    def find_busy_session_for_source(self, source_name):
        """Return the first non-terminal session for this repository source."""
        for session in self.list_sessions():
            if session.get("sourceContext", {}).get("source") != source_name:
                continue
            if is_session_busy(session):
                return session
        return None

    def create_session(self, source_name, prompt, title):
        """Create a new Jules session."""
        url = f"{JULES_API_BASE}/sessions"
        payload = {
            "prompt": prompt,
            "sourceContext": {
                "source": source_name,
                "githubRepoContext": {
                    "startingBranch": "main",
                },
            },
            "automationMode": "AUTO_CREATE_PR",
            "title": title,
        }

        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        session = response.json()

        session_id = session.get("name")
        if session_id:
            print(f"Verifying session {session_id}...")
            try:
                self.get_session(session_id)
                print("Session verification successful.")
            except Exception as exc:
                print(f"Warning: Session created but verification failed: {exc}")

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
        payload = {"prompt": message}

        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()


def run_command(command):
    """Run a shell command and return the output."""
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as exc:
        print(f"Error executing command: {command}")
        print(f"Stderr: {exc.stderr}")
        return None


def load_issue(issue_number, fields="title,body,number,comments"):
    """Load issue data from GitHub via the CLI."""
    output = run_command(["gh", "issue", "view", str(issue_number), "--json", fields])
    if not output:
        return None

    try:
        return json.loads(output)
    except json.JSONDecodeError:
        print(f"Error parsing issue JSON for #{issue_number}")
        return None


def get_event_data():
    """Read and parse the GitHub event data."""
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        return None
    try:
        with open(event_path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def extract_session_id_from_comments(comments):
    """Extract the first Jules session ID from issue comments."""
    for comment in comments:
        body = comment.get("body", "")
        match = SESSION_ID_PATTERN.search(body)
        if match:
            return match.group(1)
    return None


def find_session_id(issue_number):
    """Find the Jules Session ID from the issue comments."""
    issue = load_issue(issue_number, fields="comments")
    if not issue:
        return None
    return extract_session_id_from_comments(issue.get("comments", []))


def issue_has_queue_comment(issue_number):
    """Check whether the issue already has a queue-status comment."""
    issue = load_issue(issue_number, fields="comments")
    if not issue:
        return False

    for comment in issue.get("comments", []):
        if QUEUE_MARKER in comment.get("body", ""):
            return True
    return False


def post_issue_comment(issue_number, body):
    """Post a comment to an issue."""
    return run_command(["gh", "issue", "comment", str(issue_number), "--body", body])


def queue_issue(issue_number, busy_session):
    """Leave a single queue comment when the repository already has an active session."""
    if issue_has_queue_comment(issue_number):
        print(f"Issue #{issue_number} is already marked as queued.")
        return

    session_id = busy_session.get("name", "unknown")
    session_state = busy_session.get("state", "UNKNOWN")
    session_url = busy_session.get("url")

    comment_lines = [
        "⏳ **Jules is busy for this repository.**",
        "",
        "This issue has been queued and will be retried automatically once the active session finishes.",
        f"- **Active Session ID:** `{session_id}`",
        f"- **State:** `{session_state}`",
    ]
    if session_url:
        comment_lines.append(f"- **Session URL:** {session_url}")
    comment_lines.extend(["", QUEUE_MARKER])

    post_issue_comment(issue_number, "\n".join(comment_lines))


def list_open_issues(full_repo):
    """List open issues for the repository, oldest first."""
    output = run_command(
        [
            "gh",
            "api",
            f"repos/{full_repo}/issues?state=open&sort=created&direction=asc&per_page=100",
        ]
    )
    if not output:
        return []

    try:
        issues = json.loads(output)
    except json.JSONDecodeError:
        print("Error parsing repository issues JSON")
        return []

    if not isinstance(issues, list):
        return []

    return [
        {
            "number": issue.get("number"),
            "title": issue.get("title"),
            "body": issue.get("body"),
            "author_login": issue.get("user", {}).get("login"),
        }
        for issue in issues
        if "pull_request" not in issue
    ]


def is_repo_owner(login, repo_owner):
    """Return True when a GitHub login matches the repository owner."""
    return bool(login) and login.lower() == repo_owner.lower()


def find_next_pending_issue(full_repo, repo_owner):
    """Return the oldest owner-authored open issue without a Jules session comment."""
    for issue in list_open_issues(full_repo):
        issue_number = issue.get("number")
        if not issue_number:
            continue
        if not is_repo_owner(issue.get("author_login"), repo_owner):
            continue
        if find_session_id(issue_number):
            continue
        return {
            "number": issue_number,
            "title": issue.get("title"),
            "body": issue.get("body"),
            "author_login": issue.get("author_login"),
        }
    return None


def get_issue_from_dispatch(issue_number):
    """Load title and body for a workflow-dispatched issue."""
    print(f"Fetching details for issue #{issue_number}")
    issue_data = load_issue(issue_number, fields="title,body,number,author")
    if not issue_data:
        print(f"Error: Could not fetch details for issue #{issue_number}")
        return None
    return issue_data


def resolve_issue_for_event(event_name, event_data, full_repo):
    """Resolve the issue payload that should be handled for this invocation."""
    if event_name == "workflow_dispatch":
        print("Triggered by workflow_dispatch")
        inputs = event_data.get("inputs", {})
        issue_number = inputs.get("issue_number")
        if not issue_number:
            print("Error: issue_number input missing.")
            return None, None
        return "opened", get_issue_from_dispatch(issue_number)

    if event_name == "schedule":
        print("Triggered by schedule")
        pending_issue = find_next_pending_issue(full_repo, full_repo.split("/")[0])
        if not pending_issue:
            print("No queued issues without Jules sessions were found.")
            return None, None
        print(f"Selected queued issue #{pending_issue['number']} for processing.")
        return "opened", pending_issue

    action = event_data.get("action")
    if action not in ["opened", "created"]:
        print(f"Skipping action: {action}")
        return None, None

    issue = event_data.get("issue", {})
    return action, {
        "number": issue.get("number"),
        "title": issue.get("title"),
        "body": issue.get("body"),
        "author_login": issue.get("user", {}).get("login"),
    }


def start_issue_session(client, issue_number, title, body, owner, repo_name, full_repo):
    """Start a Jules session for an issue, or queue it when this repo is busy."""
    print(f"Processing New Issue #{issue_number}: {title} (Repo: {full_repo})")

    existing_session_id = find_session_id(issue_number)
    if existing_session_id:
        print(f"Issue #{issue_number} already has a Jules session: {existing_session_id}")
        return 0

    try:
        print("Locating Jules Source...")
        source_name = client.find_source_for_repo(owner, repo_name)

        if not source_name:
            print(f"Error: No Jules source found for {full_repo}. Has the Jules GitHub App been installed?")
            err_msg = (
                f"⚠️ I could not start a session because this repository (`{full_repo}`) "
                f"is not connected to Jules."
            )
            post_issue_comment(issue_number, err_msg)
            return 1

        busy_session = client.find_busy_session_for_source(source_name)
        if busy_session:
            print(
                "Repository already has an active Jules session: "
                f"{busy_session.get('name')} ({busy_session.get('state')})"
            )
            queue_issue(issue_number, busy_session)
            return 0

        print(f"Creating Session with Source: {source_name}")
        session = client.create_session(source_name, prompt=body or "", title=title)
        session_id = session.get("name")

        print(f"Session Created: {session_id}")

        comment_body = (
            f"🚀 **Jules Session Started!**\n\n"
            f"I have successfully created a session to work on this issue.\n"
            f"- **Session ID:** `{session_id}`\n"
            f"- **Prompt:** {title}\n\n"
            f"I will now analyze the codebase and generate a plan. "
            f"(Note: Future updates will appear here automatically when implemented)."
        )
        post_issue_comment(issue_number, comment_body)
        return 0
    except Exception as exc:
        print(f"An error occurred: {exc}")
        response_text = ""
        if hasattr(exc, "response") and exc.response is not None:
            response_text = f"\nAPI Error: {exc.response.text}"
            print(f"Response Text: {exc.response.text}")

        post_issue_comment(
            issue_number,
            f"❌ An error occurred while starting Jules: {exc}{response_text}",
        )
        return 1


def main():
    print("Starting Jules Agent Bridge...")

    jules_api_key = os.environ.get("GOOGLE_JULES_API")
    if not jules_api_key:
        print("Error: GOOGLE_JULES_API is not set.")
        sys.exit(1)

    if "GITHUB_TOKEN" not in os.environ and "GH_TOKEN" not in os.environ and "GITHUB_PAT" in os.environ:
        os.environ["GITHUB_TOKEN"] = os.environ["GITHUB_PAT"]

    event_data = get_event_data()
    if not event_data:
        print("No event data found. Exiting.")
        sys.exit(1)

    full_repo = os.environ.get("GITHUB_REPOSITORY")
    if not full_repo:
        print("Error: GITHUB_REPOSITORY not set.")
        sys.exit(1)

    owner, repo_name = full_repo.split("/")
    event_name = os.environ.get("GITHUB_EVENT_NAME")
    action, issue_data = resolve_issue_for_event(event_name, event_data, full_repo)
    if action is None:
        sys.exit(0)
    if not issue_data:
        sys.exit(1)

    issue_number = issue_data.get("number")
    title = issue_data.get("title")
    body = issue_data.get("body")
    issue_author_login = issue_data.get("author_login")

    client = JulesClient(jules_api_key)

    if action == "created" and "comment" in event_data:
        if event_data.get("issue", {}).get("pull_request"):
            print("Ignoring comment on pull request.")
            sys.exit(0)

        comment = event_data.get("comment", {})
        comment_body = comment.get("body")
        sender = event_data.get("sender", {}).get("login")

        print(f"Processing Comment on Issue #{issue_number} by {sender}")

        if sender and sender.endswith("[bot]"):
            print("Ignoring comment from bot.")
            sys.exit(0)

        if not is_repo_owner(sender, owner):
            print(f"Ignoring comment from non-owner account: {sender}")
            sys.exit(0)

        session_id = find_session_id(issue_number)
        if not session_id:
            print("No active Jules session found for this issue.")
            sys.exit(0)

        print(f"Forwarding comment to Session: {session_id}")
        try:
            client.send_message(session_id, comment_body)
            print("Comment forwarded successfully.")
        except Exception as exc:
            print(f"Error forwarding comment: {exc}")
            if hasattr(exc, "response") and exc.response is not None:
                print(f"Response Text: {exc.response.text}")
            sys.exit(1)

    if action == "opened":
        if event_name == "issues" and not is_repo_owner(issue_author_login, owner):
            print(f"Ignoring issue #{issue_number} from non-owner account: {issue_author_login}")
            sys.exit(0)
        sys.exit(start_issue_session(client, issue_number, title, body, owner, repo_name, full_repo))


if __name__ == "__main__":
    main()
