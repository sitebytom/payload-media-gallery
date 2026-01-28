# @sitebytom/payload-media-gallery

## 1.0.4

### Patch Changes

- ## Media Lightbox Refinements

  - **Enhanced Zoom & Pan**: Implemented high-precision focal point zoom for scroll, pinch-to-zoom, and double-click.
  - **Strict Bounds**: Panning now respects image edges with a minimal buffer for UI overlays.
  - **Loading Reliability**: Fixed issues with hanging spinners and improved slideshow synchronization to wait for media to load.
  - **Mobile Layout**: Restored edge-to-edge layout for images on mobile devices.
  - **UX Fixes**: Optimized drag-vs-click detection and fixed background scrolling when open.

## 1.0.3

### Patch Changes

- 3fa2a5c: Fix mobile control visibility, improve lightbox UX (swipe, layout, transparency)

## 1.0.2

### Patch Changes

- 6d343ca: Dev experience improvements (fixed DB double-start) and README updates.

## 1.0.1

### Patch Changes

- 9001a28: Fix module resolution error where the plugin was referencing the old package name for client components.
