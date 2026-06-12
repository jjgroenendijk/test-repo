# Support Cmd/Ctrl+Enter to queue URLs

**Goal**: Allow users to queue URLs by pressing Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) while the focus is in the Spotify URLs textarea.

**Details**:
To improve user experience, we can add a keyboard shortcut to submit the queue form instead of requiring the user to click the "Queue" button. We can listen for the `keydown` event on the `#spotify-url` textarea, check if the `Enter` key is pressed along with the `metaKey` or `ctrlKey`, and if so, trigger the form submission.
