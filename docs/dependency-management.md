# Dependency Management

This repository uses **Dependabot** to keep dependencies up to date.

## Automated Process

Dependabot is configured to check for updates **weekly** for the following ecosystems:

1.  **Python (`uv`)**: Checks for updates to Python packages in `pyproject.toml` and `uv.lock`.
2.  **Node.js (`npm`)**: Checks for updates to website dependencies in `website/package.json` and `website/package-lock.json`.
3.  **GitHub Actions**: Checks for updates to actions used in `.github/workflows/`.

When an update is found, Dependabot automatically:
*   Creates a new branch.
*   Updates the dependency version and lockfile.
*   Opens a Pull Request (PR) with release notes and changelogs.
*   Triggers the CI/CD pipeline to verify the changes.

## Manual Intervention

While the PR creation is automated, the following steps require manual attention or verification:

1.  **Reviewing PRs**: Developers should review the Dependabot PRs.
    *   Check the "Compatibility" score if available.
    *   Read the release notes to identify breaking changes.
2.  **Verifying CI**: Ensure that all status checks (tests, linting, build) pass.
3.  **Merging**:
    *   If the update is minor/patch and CI passes, it can usually be merged safely.
    *   Major version updates often require more careful testing.
    *   **Note**: If an auto-merge workflow is configured and criteria are met, the merge might happen automatically. Otherwise, a human must approve and merge the PR.

## Configuration

The configuration is located in [`.github/dependabot.yml`](../.github/dependabot.yml).
