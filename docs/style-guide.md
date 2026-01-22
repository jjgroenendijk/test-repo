# Apple Liquid Glass Style Guide

This document defines the design system for the "Apple Liquid Glass" aesthetic used in this project.

## Core Concepts

The style combines **Glassmorphism** (translucency, blur) with **Fluidity** (organic shapes, mesh gradients) to create a modern, premium feel similar to recent Apple interfaces (macOS Big Sur+, iOS).

## Design Tokens

### Colors & Gradients
- **Backgrounds:** Dynamic mesh gradients using pastel or vibrant tones (e.g., Purple, Blue, Pink) blended together.
- **Glass Surfaces:**
  - Background: `rgba(255, 255, 255, 0.1)` to `rgba(255, 255, 255, 0.4)`
  - Border: `1px solid rgba(255, 255, 255, 0.2)`
  - Shadow: Soft, large drop shadows (e.g., `0 8px 32px 0 rgba(31, 38, 135, 0.37)`)

### Typography
- **Font Family:** Inter (as a proxy for San Francisco) or system-ui.
- **Weights:** Light to Regular for body, Bold for headings.
- **Color:** Dark text for contrast against light glass, or White text against dark glass.

### Iconography
- **Library:** [Lucide React](https://lucide.dev)
- **Style:** Thin strokes (1.5px or 2px), rounded caps/joins.
- **Usage:** Inside glass cards or floating.

### Effects
- **Blur:** `backdrop-filter: blur(10px)` to `blur(20px)`.
- **Saturate:** `backdrop-filter: saturate(180%)` to enhance colors behind the glass.
- **Fluid Shapes:** blobs and waves for background elements.

## CSS Implementation Guide

### Glass Utility (Tailwind)
```css
.glass {
  @apply bg-white/20 backdrop-blur-lg border border-white/30 shadow-lg;
}
```

### Mesh Gradient
CSS mesh gradients or SVG blobs positioned absolutely behind the content.
