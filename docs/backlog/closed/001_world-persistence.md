# World Persistence

## What
Implement automatic saving of the game world to `localStorage` so that player progress (placed/removed blocks) is preserved between page reloads. Additionally, fix the `resetWorld` functionality to correctly regenerate the world instead of leaving it empty, and expose a "Reset World" button in the UI.

## Why
Currently, any changes made to the world are lost when the user refreshes the page. This prevents long-term play or creativity. The `resetWorld` function is also currently broken (empties the world), so users have no way to restart a fresh game without clearing browser data manually.
