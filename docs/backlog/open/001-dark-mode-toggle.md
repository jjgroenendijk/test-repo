# Dark Mode Toggle

## Description
Add a Dark Mode toggle to the SpotiFLAC Web UI. This feature allows users to switch between a light and a dark theme, improving accessibility and visual comfort, especially in low-light homelab environments.

## Tasks
- Add CSS variables in `styles.css` to define the color palette for both light and dark themes.
- Update `app.js` to render a dark mode toggle button in the top bar.
- Add Javascript logic to toggle the theme by applying a `dark` class to the body or root element and store the user's preference in `localStorage`.
- Ensure the Glassmorphism aesthetics (translucency, blur, mesh gradients) look good in both light and dark modes according to the Apple Liquid Glass Style Guide.
- Ensure all tests pass.