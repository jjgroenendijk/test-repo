import argparse
import json
import os
import re
import sys
from typing import Any


def normalize_login(login: str | None) -> str | None:
    if not login:
        return None
    normalized = login.strip().lower()
    return normalized or None


def parse_trusted_actors(raw_value: str | None, repo_owner: str | None) -> set[str]:
    """Return the normalized trusted-actor set, always including the repo owner."""
    trusted = set()

    owner_login = normalize_login(repo_owner)
    if owner_login:
        trusted.add(owner_login)

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
            normalized = normalize_login(actor) if isinstance(actor, str) else None
            if normalized:
                trusted.add(normalized)
        return trusted

    for actor in re.split(r"[\s,]+", raw_value):
        normalized = normalize_login(actor)
        if normalized:
            trusted.add(normalized)

    return trusted


def get_trusted_actors(repo_owner: str, extra_trusted_actors: str | None = None) -> set[str]:
    raw_value = extra_trusted_actors
    if raw_value is None:
        raw_value = os.environ.get("JULES_TRUSTED_ACTORS", "")
    return parse_trusted_actors(raw_value, repo_owner)


def is_trusted_actor(
    actor_login: str | None,
    repo_owner: str,
    trusted_actors_raw: str | None = None,
) -> bool:
    normalized = normalize_login(actor_login)
    if not normalized:
        return False
    return normalized in parse_trusted_actors(trusted_actors_raw, repo_owner)


def is_actor_trusted(
    actor_login: str | None,
    repo_owner: str,
    extra_trusted_actors: str | None = None,
) -> bool:
    return is_trusted_actor(actor_login, repo_owner, extra_trusted_actors)


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() == "true"
    return bool(value)


def extract_login(value: Any) -> str | None:
    if isinstance(value, str):
        return normalize_login(value)
    if isinstance(value, dict):
        login = value.get("login")
        if isinstance(login, str):
            return normalize_login(login)
    return None


def extract_pr_author_login(pr_data: dict[str, Any]) -> str | None:
    for candidate in (
        pr_data.get("author_login"),
        pr_data.get("author"),
        pr_data.get("user"),
    ):
        login = extract_login(candidate)
        if login:
            return login
    return None


def extract_pr_head_repo_owner(pr_data: dict[str, Any]) -> str | None:
    candidates = [
        pr_data.get("head_repo_owner"),
        pr_data.get("headRepositoryOwner"),
    ]

    head = pr_data.get("head")
    if isinstance(head, dict):
        repo = head.get("repo")
        if isinstance(repo, dict):
            candidates.append(repo.get("owner"))

    head_repository = pr_data.get("headRepository")
    if isinstance(head_repository, dict):
        candidates.append(head_repository.get("owner"))

    for candidate in candidates:
        login = extract_login(candidate)
        if login:
            return login
    return None


def is_trusted_pr(
    author_login: str | None,
    head_owner_login: str | None,
    is_cross_repository: Any,
    repo_owner: str | None,
    trusted_actors_raw: str | None = None,
) -> bool:
    """Return True for same-repo PRs from trusted authors only."""
    if _as_bool(is_cross_repository):
        return False

    normalized_repo_owner = normalize_login(repo_owner)
    normalized_head_owner = normalize_login(head_owner_login)
    if not normalized_repo_owner or normalized_head_owner != normalized_repo_owner:
        return False

    return is_trusted_actor(author_login, normalized_repo_owner, trusted_actors_raw)


def is_pr_trusted(
    pr_data: dict[str, Any],
    repo_owner: str,
    extra_trusted_actors: str | None = None,
) -> bool:
    if not isinstance(pr_data, dict):
        return False

    return is_trusted_pr(
        author_login=extract_pr_author_login(pr_data),
        head_owner_login=extract_pr_head_repo_owner(pr_data),
        is_cross_repository=pr_data.get("isCrossRepository", pr_data.get("is_cross_repository")),
        repo_owner=repo_owner,
        trusted_actors_raw=extra_trusted_actors,
    )


def load_json(path: str) -> Any:
    if path == "-":
        return json.load(sys.stdin)
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate trusted automation actors and PRs.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    actor_parser = subparsers.add_parser("actor", help="Check whether an actor is trusted.")
    actor_parser.add_argument("--actor", required=True)
    actor_parser.add_argument("--repo-owner", required=True)
    actor_parser.add_argument("--trusted-actors", default=None)
    actor_parser.add_argument("--extra-trusted-actors", default=None)

    pr_parser = subparsers.add_parser("pr", help="Check whether a PR is trusted.")
    pr_parser.add_argument("--author")
    pr_parser.add_argument("--head-owner")
    pr_parser.add_argument("--is-cross")
    pr_parser.add_argument("--repo-owner", required=True)
    pr_parser.add_argument("--trusted-actors", default=None)
    pr_parser.add_argument("--extra-trusted-actors", default=None)
    pr_parser.add_argument("--pr-file")

    return parser.parse_args()


def main() -> int:
    args = parse_args()
    trusted_actors_raw = args.extra_trusted_actors
    if trusted_actors_raw is None:
        trusted_actors_raw = args.trusted_actors

    if args.command == "actor":
        trusted = is_trusted_actor(args.actor, args.repo_owner, trusted_actors_raw)
    elif args.pr_file:
        trusted = is_pr_trusted(load_json(args.pr_file), args.repo_owner, trusted_actors_raw)
    else:
        if args.author is None or args.head_owner is None or args.is_cross is None:
            raise SystemExit("pr command requires either --pr-file or --author/--head-owner/--is-cross")
        trusted = is_trusted_pr(
            args.author,
            args.head_owner,
            args.is_cross,
            args.repo_owner,
            trusted_actors_raw,
        )

    print("trusted" if trusted else "untrusted")
    return 0 if trusted else 1


if __name__ == "__main__":
    raise SystemExit(main())
