# Procedural World Generation

## What
Implement algorithmic world generation for the game. Instead of a hardcoded set of starting cubes, the game should generate a terrain using a noise algorithm (e.g., Simplex Noise or Perlin Noise). The terrain should vary in height and look interesting, potentially with different block types appearing at different heights.

## Why
A hardcoded world is static and boring. Procedural generation ensures that every game session offers a slightly different experience (or at least a larger, more interesting landscape), increasing replayability and visual appeal. This satisfies the new game requirement.

## Implementation Details
-   Used `simplex-noise` library for 2D noise generation.
-   Mapped noise values to height (y-coordinate).
-   Implemented a `generateWorld` function in `website/lib/generation.ts`.
-   Added simple tree generation logic based on random chance on grass blocks.
-   Updated `website/lib/store.ts` to initialize the world with `generateWorld(20, 20)`.
