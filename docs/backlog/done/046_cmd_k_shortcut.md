# Cmd+K / Ctrl+K Global Shortcut

Implement a global keyboard shortcut (Cmd+K on Mac, Ctrl+K on Windows/Linux) to focus the job search input field.
This is a common convention in modern web applications that improves keyboard navigation and usability.

When the user presses the shortcut:
1. The default browser behavior (if any) should be prevented
2. The search input (`#job-search-input`) should be focused

We should also add a visual indicator (like a small badge saying `Cmd K` or `Ctrl K`) inside or next to the search bar so users know the shortcut exists.
