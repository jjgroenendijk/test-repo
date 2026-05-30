# Add job stats functionality

## Description
Provide high-level stats about downloaded files and execution times on the SpotiFLAC dashboard, to give homelab users an overview of usage.

## Implementation details
- Backend should expose a new endpoint `/api/stats` that reads through history and calculates:
  - Total jobs
  - Total files downloaded
  - Success rate
- Frontend should display these stats near the storage panel.
