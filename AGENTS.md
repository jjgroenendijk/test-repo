# Agent Instructions

## Workflow Rules

1.  **Troubleshooting First**: Always check `docs/troubleshooting/open/` for open cases.
    - If a case exists, prioritize it.
    - When finished, ensure the solution is documented and verified, then move the file to `docs/troubleshooting/closed/`.

2.  **Backlog Second**: If no open troubleshooting cases exist, check `docs/backlog/open/`.
    - Work on the backlog item with the biggest value.
    - Backlog items should be moved to `docs/backlog/closed/` when completed.

3.  **Testing**:
    - All new features must include unit tests and Playwright tests (if applicable).
    - Ensure everything can be tested by AI systems.

4.  **Documentation**:
    - Keep README.md updated, including screenshots for visual features.
