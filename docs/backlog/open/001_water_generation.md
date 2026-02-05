# Water Generation

## What
Implement water generation in the procedural world generation logic. Water blocks should appear below a certain height level (e.g., y=2) in empty spaces, creating lakes, rivers, or oceans. The 'water' block type should be added to the game, with a distinct color (e.g., blue).

## Why
Currently, the world consists only of land (dirt, grass) and trees. Adding water adds visual variety and makes the terrain more interesting and realistic, fulfilling the requirement for an "interesting" procedural world.

## Progress
- [x] Initialized backlog item.
- [x] Added `water` to `CubeType` in `website/lib/store.ts`.
- [x] Updated `website/components/game/Cube.tsx` to render water blocks with transparency.
- [x] Updated `website/components/game/TextureSelector.tsx` to include water texture.
- [x] Implemented water generation logic in `website/lib/generation.ts`.
- [x] Updated and verified unit tests (`website/tests/generation.test.ts`).
