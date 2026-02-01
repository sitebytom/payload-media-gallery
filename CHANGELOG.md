# @sitebytom/payload-media-gallery

## 1.1.2

### Patch Changes

- Optimize Lightbox with progressive image loading using `srcset` and `sizes` for initial load, switching to high-res original on zoom.

## 1.1.1

### Patch Changes

- Fix critical performance issue by using thumbnail instead of original image in MediaCard

## 1.1.0

### Minor Changes

- dba48df: Refactor UI components to be generic and decoupled from Payload logic, making it easier to register custom layouts.

  ### New Features

  - **Masonry Layout**: Added a responsive Masonry view with intrinsic aspect ratio support (`src/components/ui/Layouts/Masonry`).

  ### Improvements

  - **Modularity**: Moved `GalleryItem` to `MediaItem` and standardized component props (`src/components/ui/types.ts`).
  - **Layout Registry**: Simplified layout registration via `layoutRegistry` (`src/components/ui/Layouts/registry.tsx`).
  - **Styles**: Unscoped component styles to support reuse across different layouts.

## 1.0.9

### Patch Changes

- 7444342: Standardize icon casing to lowercase `src/icons` to resolve cross-platform build errors. Cleaned up redundant legacy component files from the `src` directory.

## 1.0.8

### Patch Changes

- Standardized icon casing to lowercase `src/icons` to resolve cross-platform build errors.
- Cleaned up redundant legacy component files from the `src` directory.

## 1.0.7

### Patch Changes

- 9a60945: Replace local useZoomPan hook with official @sitebytom/use-zoom-pan npm package (https://github.com/sitebytom/use-zoom-pan). Simplified Lightbox implementation and fixed interaction hit-areas.

## 1.0.6

### Patch Changes

- 76bb185: ## Features

  - **Header Selection Actions**: Added a "Deselect All" button to the list selection bar. This button renders intelligently next to the "Select All" count when items are selected, filling a gap in the default Payload list view (Grid/Justified) where "Deselect All" is otherwise inaccessible.

  ## Improvements

  - **Package Size**: Excluded `src` directory from the published npm package to reduce install size.

## 1.0.5

### Patch Changes

- # 1.0.5 Release

  This release brings significant improvements to the codebase structure, documentation, and the Lightbox experience.

  ## Features & Improvements

  - **Lightbox Overhaul**:
    - Implemented smooth open/close fade transitions.
    - Added loading states with a spinner for improved UX.
    - Added Focus Trap for better accessibility.
    - Implemented Zoom & Pan capabilities with mouse and touch support.
    - Added constraints to prevent panning out of bounds.
    - Fixed scroll-to-zoom passive event listener errors.
    - Smart preloading for next/previous images.
  - **Documentation**: Updated README to accurately reflect current features (Layouts, Lightbox, etc.).

  ## Refactoring

  - **CSS Standardization**: Renamed all classes to use a unified `media-gallery-*` namespace to avoid collisions.
  - **Scoped Styles**: Scoped all Payload override styles within the plugin container to prevent global leaks.
  - **Icon Refactor**: Split the monolithic `src/Icons/index.tsx` into individual component files.
  - **Component Organization**: Improved internal file structure and standardized naming conventions.

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
