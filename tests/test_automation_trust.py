import os
import sys


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from automation_trust import is_trusted_actor, is_trusted_pr, parse_trusted_actors


def test_parse_trusted_actors_supports_json_and_owner_default():
    trusted = parse_trusted_actors('["app/google-jules", "someone-else"]', "RepoOwner")

    assert trusted == {"repoowner", "app/google-jules", "someone-else"}


def test_parse_trusted_actors_supports_csv():
    trusted = parse_trusted_actors("app/google-jules, teammate ", "RepoOwner")

    assert trusted == {"repoowner", "app/google-jules", "teammate"}


def test_is_trusted_actor_allows_owner_and_allowlisted_actor():
    assert is_trusted_actor("RepoOwner", "repoowner", "")
    assert is_trusted_actor("app/google-jules", "repoowner", '["app/google-jules"]')
    assert not is_trusted_actor("random-user", "repoowner", '["app/google-jules"]')


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
