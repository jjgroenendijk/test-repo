# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "requests",
#     "beautifulsoup4",
#     "markdownify",
# ]
# ///

import base64
import os
import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from urllib.parse import urljoin

BASE_URL = "https://jules.google/docs/api/reference/"
OUTPUT_DIR = "docs/reference/Google-Jules"

# Define the pages to download.
# Key is the filename (without extension), Value is the path relative to BASE_URL.
PAGES = {
    "quickstart": "",
    "overview": "overview",
    "authentication": "authentication",
    "sessions": "sessions",
    "activities": "activities",
    "sources": "sources",
    "types": "types",
}

def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

def image_to_base64(img_url):
    try:
        print(f"  Downloading image: {img_url}")
        response = requests.get(img_url)
        response.raise_for_status()
        content_type = response.headers.get("Content-Type", "image/png")
        encoded = base64.b64encode(response.content).decode("utf-8")
        return f"data:{content_type};base64,{encoded}"
    except Exception as e:
        print(f"  Failed to download image {img_url}: {e}")
        return img_url

def process_page(name, slug):
    url = urljoin(BASE_URL, slug)
    print(f"Processing {name} ({url})...")

    try:
        response = requests.get(url)
        response.raise_for_status()
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return

    soup = BeautifulSoup(response.content, "html.parser")

    # Extract main content
    content = soup.find(class_="sl-markdown-content")
    if not content:
        print(f"Could not find content (.sl-markdown-content) for {name}")
        return

    # Process images
    for img in content.find_all("img"):
        src = img.get("src")
        if src:
            full_src = urljoin(url, src)
            b64_src = image_to_base64(full_src)
            img["src"] = b64_src

    # Get inner HTML to avoid processing the wrapper div
    inner_html = "".join([str(x) for x in content.contents])

    # Convert to Markdown
    # strip=['a'] would remove links, which we don't want.
    # We assume markdownify handles most standard tags.
    # We strip 'div' and 'span' to avoid leftover structural tags.
    markdown_text = md(inner_html, heading_style="atx", strip=['div', 'span'])

    # Clean up multiple newlines which often happen
    while "\n\n\n" in markdown_text:
        markdown_text = markdown_text.replace("\n\n\n", "\n\n")

    filename = os.path.join(OUTPUT_DIR, f"{name}.md")
    with open(filename, "w", encoding="utf-8") as f:
        f.write(markdown_text)
    print(f"Saved {filename}")

def main():
    ensure_dir(OUTPUT_DIR)
    for name, slug in PAGES.items():
        process_page(name, slug)

if __name__ == "__main__":
    main()
