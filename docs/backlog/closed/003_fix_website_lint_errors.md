# Fix Website Lint Errors

## What
Fix the lint errors reported by `npm run lint` in the `website/` directory.
The errors are located in:
-   `website/components/game/Cube.tsx`
-   `website/components/game/Ground.tsx`
-   `website/components/game/Player.tsx`

The errors involve usage of `any` type and unused variables.

## Why
Lint errors can block CI checks and deployment. They also indicate potential type safety issues or code quality problems.
These errors were observed during conflict resolution for PR #88 but were unrelated to that PR.
