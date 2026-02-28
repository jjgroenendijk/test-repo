import argparse
import json


def parse_trusted_actors(raw_value, repo_owner):
    """Return the normalized trusted-actor set, always including the repo owner."""
    trusted = set()
    if repo_owner:
        trusted.add(repo_owner.strip().lower())

    if not raw_value:
        return trusted

    raw_value = raw_value.strip()
    if not raw_value:
        return trusted

    try:
        parsed = json.loads(raw_value)
    except json.JSONDecodeError:
        parsed = None

    if isinstance(parsed, list):
        for actor in parsed:
            if isinstance(actor, str) and actor.strip():
                trusted.add(actor.strip().lower())
        return trusted

    for actor in raw_value.split(","):
        actor = actor.strip()
        if actor:
            trusted.add(actor.lower())

    return trusted


def is_trusted_actor(actor_login, repo_owner, trusted_actors_raw=None):
    """Return True when the actor is trusted for privileged automation."""
    if not actor_login:
        return False
    return actor_login.strip().lower() in parse_trusted_actors(trusted_actors_raw, repo_owner)


def _as_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() == "true"
    return bool(value)


def is_trusted_pr(
    author_login,
    head_owner_login,
    is_cross_repository,
    repo_owner,
    trusted_actors_raw=None,
):
    """Return True for same-repo PRs from trusted authors only."""
    if _as_bool(is_cross_repository):
        return False
    if not repo_owner or not head_owner_login:
        return False
    if head_owner_login.strip().lower() != repo_owner.strip().lower():
        return False
    return is_trusted_actor(author_login, repo_owner, trusted_actors_raw)


def main():
    parser = argparse.ArgumentParser(description="Evaluate trusted automation actors and PRs.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    actor_parser = subparsers.add_parser("actor", help="Check whether an actor is trusted.")
    actor_parser.add_argument("--actor", required=True)
    actor_parser.add_argument("--repo-owner", required=True)
    actor_parser.add_argument("--trusted-actors", default="")

    pr_parser = subparsers.add_parser("pr", help="Check whether a PR is trusted.")
    pr_parser.add_argument("--author", required=True)
    pr_parser.add_argument("--head-owner", required=True)
    pr_parser.add_argument("--is-cross", required=True)
    pr_parser.add_argument("--repo-owner", required=True)
    pr_parser.add_argument("--trusted-actors", default="")

    args = parser.parse_args()

    if args.command == "actor":
        trusted = is_trusted_actor(args.actor, args.repo_owner, args.trusted_actors)
        raise SystemExit(0 if trusted else 1)

    trusted = is_trusted_pr(
        args.author,
        args.head_owner,
        args.is_cross,
        args.repo_owner,
        args.trusted_actors,
    )
    raise SystemExit(0 if trusted else 1)


if __name__ == "__main__":
    main()
