# Add Health Check Timeout

The UI currently polls `/api/health` to determine connection status. However, if the backend hangs indefinitely, the UI fetch request will wait for the browser's default timeout (which can be very long), causing the UI to falsely appear online.

We should implement a timeout (e.g. 5 seconds) for the health check fetch request in the UI so that a hung backend is quickly reported as offline.
