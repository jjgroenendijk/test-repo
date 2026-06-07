# Hide Job ID behind a hover state

Currently, the Job ID is always visible on the job card, taking up space and potentially cluttering the UI. We should hide it by default and reveal it on hover, or add a subtle way to view/copy it without taking up permanent vertical space.

Requirements:
- Modify `website/src/app.js` and `website/src/styles.css` to hide the Job ID paragraph by default, and show it when the `.job-card` is hovered.
- Ensure the "Copy ID" functionality remains accessible when revealed.
