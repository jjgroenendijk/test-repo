# Agent Instructions

## Workflow Rules

1. **Troubleshooting First**
   - Always check `docs/troubleshooting/open/` for open cases.
   - If a case exists, prioritize it.
   - When finished, document verification and move the file to `docs/troubleshooting/closed/`.

2. **Backlog Second**
   - If no troubleshooting case is open, check `docs/backlog/open/`.
   - Work on the highest-value backlog item.
   - Move completed items to `docs/backlog/closed/`.

3. **Requirements Check**
   - If no backlog item is open, check `docs/requirements.md`.
   - If a requirement is unsatisfied, open a new backlog item in `docs/backlog/open/`.
   - Keep backlog progress updated while implementing.

4. **New Requirement Invention**
   - If no requirements or backlog items are open, propose a simple high-value requirement for the yt-dlp web interface.
   - Start implementation and create/maintain an open backlog item during the work.

5. **Testing**
   - New features must include unit tests and Playwright tests where applicable.
   - Keep features testable by AI systems.

6. **Deployment & CI**
   - The product must be distributed as a single container image.
   - CI must run quality checks and publish the container.

7. **Documentation**
   - Keep `README.md` and relevant docs updated.

8. **Issue Encountered**
   - If an issue blocks progress, stop feature work.
   - Do quick research.
   - Create a GitHub issue for the blocker.
   - Continue original work after issue creation.
