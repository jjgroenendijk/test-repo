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


def get_trusted_actors(repo_owner: str, extra_trusted_actors: str | None = None) -> set[str]:
    trusted = set()

    owner_login = normalize_login(repo_owner)
    if owner_login:
        trusted.add(owner_login)

    raw_value = extra_trusted_actors
    if raw_value is None:
        raw_value = os.environ.get("JULES_TRUSTED_ACTORS", "")

    for actor in re.split(r"[\s,]+", raw_value):
        normalized = normalize_login(actor)
        if normalized:
            trusted.add(normalized)

    return trusted


def is_actor_trusted(
    actor_login: str | None,
    repo_owner: str,
    extra_trusted_actors: str | None = None,
) -> bool:
    normalized = normalize_login(actor_login)
    if not normalized:
        return False
    return normalized in get_trusted_actors(repo_owner, extra_trusted_actors)


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


def is_pr_trusted(
    pr_data: dict[str, Any],
    repo_owner: str,
    extra_trusted_actors: str | None = None,
) -> bool:
    if not isinstance(pr_data, dict):
        return False

    if bool(pr_data.get("isCrossRepository", pr_data.get("is_cross_repository"))):
        return False

    repo_owner_login = normalize_login(repo_owner)
    head_repo_owner = extract_pr_head_repo_owner(pr_data)
    if not repo_owner_login or head_repo_owner != repo_owner_login:
        return False

    author_login = extract_pr_author_login(pr_data)
    return is_actor_trusted(author_login, repo_owner, extra_trusted_actors)


def load_json(path: str) -> Any:
    if path == "-":
        return json.load(sys.stdin)
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate trusted actors and PRs.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    actor_parser = subparsers.add_parser("actor", help="Check whether an actor is trusted.")
    actor_parser.add_argument("--repo-owner", required=True)
    actor_parser.add_argument("--actor", required=True)
    actor_parser.add_argument("--extra-trusted-actors")

    pr_parser = subparsers.add_parser("pr", help="Check whether a PR is trusted.")
    pr_parser.add_argument("--repo-owner", required=True)
    pr_parser.add_argument("--pr-file", default="-")
    pr_parser.add_argument("--extra-trusted-actors")

    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.command == "actor":
        trusted = is_actor_trusted(args.actor, args.repo_owner, args.extra_trusted_actors)
    else:
        pr_data = load_json(args.pr_file)
        trusted = is_pr_trusted(pr_data, args.repo_owner, args.extra_trusted_actors)

    print("trusted" if trusted else "untrusted")
    return 0 if trusted else 1


if __name__ == "__main__":
    raise SystemExit(main())
