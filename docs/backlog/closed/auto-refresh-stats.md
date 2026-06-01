# System stats auto-refresh requirement

The web UI displays system stats (total jobs, files, success rate) and system storage usage.
These are fetched once when the page loads, but they do not automatically refresh while jobs are running or completing.

Add an auto-refresh mechanism for the stats and storage usage, matching the interval used for checking job status (which updates every 2 seconds).
