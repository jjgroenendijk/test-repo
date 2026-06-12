# Add Keyboard Shortcut to Queue URLs (Ctrl+Enter)

## Problem
Currently, users must manually click the "Queue" button to submit the form after pasting or typing Spotify URLs into the multiline textarea. Adding a keyboard shortcut would speed up the workflow.

## Requirements
- Support `Ctrl + Enter` (and `Cmd + Enter` on macOS) within the `textarea` to submit the queue form.
- Use `form.requestSubmit()` to properly trigger the submit event and native HTML validations.
- Include a Playwright test to verify this shortcut behavior.
