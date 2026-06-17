# Requirement: Bulk Upload URLs from Text File

As a user, I want to be able to upload a `.txt` file containing Spotify URLs (one per line) so that I can easily queue multiple items at once without manually copying and pasting them into the textarea.

## Implementation details
- Add a file input element that accepts text files.
- Add a "Load File" button next to the "Queue" button or the textarea.
- Clicking the "Load File" button triggers the hidden file input.
- Upon selecting a `.txt` file, read its contents.
- Append the file's contents to the existing text in the `textarea` (separated by newlines), so they can be queued.
