import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from jules import JulesClient

SCHEDULED_PROMPT = (
    "Start working according the workflow in AGENTS.md. "
    "Do not ask questions, just do what you think is the best option. "
    "Your questions will be ignored."
)
SCHEDULED_TITLE = "Scheduled Autonomous Run"


def main():
    api_key = os.environ.get("GOOGLE_JULES_API")
    if not api_key:
        print("Error: GOOGLE_JULES_API is not set.")
        return 1

    full_repo = os.environ.get("GITHUB_REPOSITORY")
    if not full_repo or "/" not in full_repo:
        print("Error: GITHUB_REPOSITORY is not set or malformed.")
        return 1

    owner, repo_name = full_repo.split("/", 1)
    client = JulesClient(api_key)

    source_name = client.find_source_for_repo(owner, repo_name)
    if not source_name:
        print(
            f"Error: No Jules source found for {full_repo}. "
            "Has the Jules GitHub App been installed?"
        )
        return 1

    session = client.create_session(
        source_name, prompt=SCHEDULED_PROMPT, title=SCHEDULED_TITLE
    )
    print(f"Started scheduled Jules session: {session.get('name')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
