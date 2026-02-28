import os
import sys


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from automation_trust import (
    get_trusted_actors,
    is_actor_trusted,
    is_pr_trusted,
    is_trusted_actor,
    is_trusted_pr,
    parse_trusted_actors,
)


def test_parse_trusted_actors_supports_json_and_owner_default():
    trusted = parse_trusted_actors('["app/google-jules", "someone-else"]', "RepoOwner")

    assert trusted == {"repoowner", "app/google-jules", "someone-else"}


def test_get_trusted_actors_supports_csv_and_whitespace_lists():
    trusted = get_trusted_actors("RepoOwner", "bot-one, Bot-Two  bot-three")

    assert trusted == {"repoowner", "bot-one", "bot-two", "bot-three"}


def test_actor_helpers_allow_owner_and_allowlisted_actor():
    assert is_trusted_actor("RepoOwner", "repoowner", "")
    assert is_actor_trusted("trusted-bot", "repoowner", '["trusted-bot"]')
    assert not is_trusted_actor("random-user", "repoowner", '["trusted-bot"]')


def test_is_trusted_pr_requires_same_repo_and_trusted_author():
    assert is_trusted_pr(
        author_login="app/google-jules",
        head_owner_login="RepoOwner",
        is_cross_repository=False,
        repo_owner="repoowner",
        trusted_actors_raw='["app/google-jules"]',
    )
    assert not is_trusted_pr(
        author_login="random-user",
        head_owner_login="RepoOwner",
        is_cross_repository=False,
        repo_owner="repoowner",
        trusted_actors_raw='["app/google-jules"]',
    )
    assert not is_trusted_pr(
        author_login="app/google-jules",
        head_owner_login="fork-owner",
        is_cross_repository=True,
        repo_owner="repoowner",
        trusted_actors_raw='["app/google-jules"]',
    )


def test_is_pr_trusted_supports_pull_request_payload_shape():
    pr_data = {
        "user": {"login": "trusted-bot"},
        "is_cross_repository": False,
        "head": {
            "repo": {
                "owner": {"login": "RepoOwner"},
            }
        },
    }

    assert is_pr_trusted(pr_data, "repoowner", "trusted-bot")


def test_is_pr_trusted_rejects_mismatched_head_owner():
    pr_data = {
        "author": {"login": "RepoOwner"},
        "isCrossRepository": False,
        "headRepositoryOwner": {"login": "someone-else"},
    }

    assert not is_pr_trusted(pr_data, "repoowner")
