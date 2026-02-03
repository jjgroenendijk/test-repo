# Agent Instructions

## Workflow Rules

1.  **Troubleshooting First**: Always check `docs/troubleshooting/open/` for open cases.
    - If a case exists, prioritize it.
    - When finished, ensure the solution is documented and verified, then move the file to `docs/troubleshooting/closed/`.

2.  **Backlog Second**: If no open troubleshooting cases exist, check `docs/backlog/open/`.
    - Work on the backlog item with the biggest value.
    - Backlog items should be moved to `docs/backlog/closed/` when completed.

3.  **Requirements Check**: If no backlog items are open, check `docs/requirements.md` for the game requirements.
    - If a game requirement is not yet satisfied, start working on this new game requirement.
    - A corresponding open backlog item must be created in `docs/backlog/open/`.
    - The progress has to be written in this open backlog item **while** working on the requirement! Not after the requirement is fully done, but the open backlog task has to be actively maintained and updated during working on the new requirement.

4.  **New Requirement Invention**: If no requirements are left open, and no backlog items are left open, try to come up with a new simple but high value requirement for the open world game to make the game more interesting.
    - Start working on that new requirement.
    - A new open backlog item must be opened in `docs/backlog/open/`.
    - This new backlog item MUST stay up to date with current progress **WHILE** working on the new requirement. It is absolutely critical to keep the backlog item up to date during the work, not when all work is already done.

5.  **Testing**:
    - All new features must include unit tests and Playwright tests (if applicable).
    - Ensure everything can be tested by AI systems.

6.  **Documentation**:
    - Keep README.md updated, including screenshots for visual features.

7.  **Issue Encountered**:
    - If an issue is encountered, you **MUST STOP ALL WORK**.
    - Do some quick research about the issue.
    - Create a GitHub issue for it.
    - After the GitHub issue is created, you can continue with your original work.
