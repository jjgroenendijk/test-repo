# 011 Publish container image to GitHub Container Registry

## Goal
Ensure the single SpotiFLAC web UI container image is published to GitHub Container Registry.

## Desired outcome
- CI builds the repository's runtime Docker image.
- CI publishes the image to `ghcr.io`.
- CI tests the GitHub-hosted image after it is published.
- Published images are tagged with useful immutable and branch/version tags.
- The README documents how users can pull and run the published image instead of building from source.

## Constraints
- Keep the product distributed as one runnable container image.
- Do not require users to build locally for normal deployment.
- Keep Docker and Docker Compose deployment workflows based on the hosted GHCR image.

## Current notes
- `.github/workflows/publish-container.yml` already targets `ghcr.io/${{ github.repository }}`.
- `README.md` already notes that `Publish Container` builds and publishes the runtime image to GHCR.
- Follow-up work should verify tags, permissions, hosted-image smoke tests, and user-facing pull/run documentation.

## Status
- [ ] Verify the GHCR publish workflow tags and permissions.
- [ ] Document the published image pull/run path in `README.md`.
- [ ] Confirm CI publishes the image after the container build succeeds.
- [ ] Add CI verification that pulls the published GHCR image and smoke-tests the running container.

## Verification
- Review `.github/workflows/publish-container.yml`.
- Confirm the published package appears under the repository's GitHub Container Registry packages.
- Pull and run the published image with Docker.
- Verify the hosted container serves the web UI on `http://localhost:3000`.
