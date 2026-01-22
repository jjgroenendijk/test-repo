# Google Jules Integration

This repository is configured to work with **Google Jules**, an AI software engineering agent.

## Overview

Jules is integrated via GitHub Actions to automatically respond to new Issues. When you create an issue describing a task, Jules will:
1.  Read the issue.
2.  Start a new session in the Google Jules service.
3.  Post a confirmation comment with the Session ID.
4.  (In the future) Analyze the code and open a Pull Request.

## Getting Started

### Prerequisites

*   **GitHub CLI (`gh`):** Required for interacting with GitHub from the command line.
*   **Python (with `uv`):** Used to run the bridge script.
*   **API Keys:**
    *   `GOOGLE_JULES_API`: Must be set in the repository secrets.

### Setup

To prepare your local environment (e.g., for testing the scripts):

```bash
./setup.sh
```

This script installs the GitHub CLI if it is missing.

### Usage

Simply **open a new Issue** in this repository.

1.  Go to the [Issues tab](../../issues).
2.  Click "New Issue".
3.  Provide a clear title and description of the task you want Jules to perform.
4.  Submit the issue.
5.  Wait for Jules to comment confirming receipt.

## Documentation

For detailed requirements and architecture, see [docs/requirements.md](docs/requirements.md).
