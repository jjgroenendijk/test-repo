import os
import sys


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import automation_trust


def test_get_trusted_actors_includes_repo_owner_by_default():
    trusted = automation_trust.get_trusted_actors("RepoOwner")

    assert trusted == {"repoowner"}


def test_get_trusted_actors_merges_optional_variable_values():
    trusted = automation_trust.get_trusted_actors("RepoOwner", "bot-one, Bot-Two  bot-three")

    assert trusted == {"repoowner", "bot-one", "bot-two", "bot-three"}


def test_is_actor_trusted_accepts_owner_and_extra_actors():
    assert automation_trust.is_actor_trusted("RepoOwner", "repoowner")
    assert automation_trust.is_actor_trusted("trusted-bot", "repoowner", "trusted-bot")
    assert not automation_trust.is_actor_trusted("someone-else", "repoowner", "trusted-bot")


def test_is_pr_trusted_requires_same_repo_owner_and_trusted_author():
    pr_data = {
        "author": {"login": "trusted-bot"},
        "isCrossRepository": False,
        "headRepositoryOwner": {"login": "RepoOwner"},
    }

    assert automation_trust.is_pr_trusted(pr_data, "repoowner", "trusted-bot")


def test_is_pr_trusted_rejects_cross_repo_prs():
    pr_data = {
        "author": {"login": "RepoOwner"},
        "isCrossRepository": True,
        "headRepositoryOwner": {"login": "RepoOwner"},
    }

    assert not automation_trust.is_pr_trusted(pr_data, "repoowner")


def test_is_pr_trusted_rejects_mismatched_head_owner():
    pr_data = {
        "author": {"login": "RepoOwner"},
        "isCrossRepository": False,
        "headRepositoryOwner": {"login": "someone-else"},
    }

    assert not automation_trust.is_pr_trusted(pr_data, "repoowner")


def test_is_pr_trusted_rejects_untrusted_author():
    pr_data = {
        "author": {"login": "someone-else"},
        "isCrossRepository": False,
        "headRepositoryOwner": {"login": "RepoOwner"},
    }

    assert not automation_trust.is_pr_trusted(pr_data, "repoowner")


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

    assert automation_trust.is_pr_trusted(pr_data, "repoowner", "trusted-bot")
