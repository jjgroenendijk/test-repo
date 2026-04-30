#!/bin/bash
set -e

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if gh is already installed
if command_exists gh; then
  echo "GitHub CLI (gh) is already installed."
  gh --version
  exit 0
fi

echo "Installing GitHub CLI..."

# Install curl if not present
if ! command_exists curl; then
    echo "Installing curl..."
    sudo apt-get update
    sudo apt-get install -y curl
fi

# Create keyrings directory if it doesn't exist
sudo mkdir -p -m 755 /etc/apt/keyrings

# Download and install the keyring
echo "Downloading GitHub CLI keyring..."
out=$(mktemp)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg -o "$out"
sudo mv "$out" /etc/apt/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg

# Add the repository to sources.list.d
echo "Adding GitHub CLI repository..."
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null

# Update package lists and install gh
echo "Updating package lists and installing gh..."
sudo apt-get update
sudo apt-get install -y gh

# Verify installation
if command_exists gh; then
    echo "GitHub CLI installed successfully!"
    gh --version
else
    echo "Failed to install GitHub CLI."
    exit 1
fi
