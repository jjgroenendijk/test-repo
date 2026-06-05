# Title: Add 'Copy Job ID' button to Job Cards
# Problem:
Homelab users who self-host SpotiFLAC have the `/data` volume mounted locally on their servers. When a job completes or fails, they might want to inspect the raw files or logs directly on the server filesystem. Currently, the UI does not display the internal Job ID, which corresponds to the folder name in the `/data` volume. This makes server-side debugging or file management difficult.
# Solution:
Display the Job ID in the job card UI and provide a 'Copy Job ID' button. This will copy the UUID to the user's clipboard, making it trivial to find the corresponding folder in their homelab environment (e.g., `/data/UUID`).
