# Liquid Glass Design Implementation

## Description
Implement the "Apple Liquid Glass" design system across the SpotiFLAC web UI, as specified in `docs/style-guide.md`. The design should feature dynamic mesh gradient backgrounds, translucent glassmorphism panels, and elegant typography.

## Requirements
- Dynamic mesh gradient background on the main `body`.
- Glassmorphism effects (backdrop-filter blur, semi-transparent backgrounds, subtle borders, soft shadows) applied to all major panels (`.queue-panel`, `.storage-panel`, `.job-card`, etc.).
- Update colors, inputs, and buttons to match the premium, modern aesthetic.
- Ensure text remains readable (contrast) over the glass surfaces.

## Implementation Details
- Target `website/src/styles.css`.
- Add a mesh gradient background (e.g., animated radial gradients or a static mesh) to the `body`.
- Create a `.glass` utility or directly apply the glass properties to the necessary elements.
- Ensure layout responsiveness is maintained.
