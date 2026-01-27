![Payload Media Gallery](.github/assets/banner.png)

# Payload Media Gallery Plugin
A Payload CMS 3 plugin that enhances the dashboard media collection view. It adds view toggles for justified and grid layouts while keeping the original list view. Features include quick edit drawer, bulk selection, focal point cropping and a lightbox for images, video playback, and audio files.


## Features
- **Justified, Grid and List Layouts** (Justified as default).
- **Lightbox** for images, video playback, and audio files.
- **Focal Point Support** for consistent cropping.
- **Document handling** with graceful fallbacks and download links.
- **Video Previews** on hover.
- **Quick Edit** via native Payload drawers.
- **Bulk Selection** with keyboard modifier support.
- **Payload-Native UI** for a seamless experience.

## Installation
```bash
npm install @sitebytom/payload-media-gallery
# or
pnpm add @sitebytom/payload-media-gallery
# or
yarn add @sitebytom/payload-media-gallery
```

## Usage
In your `payload.config.ts`:
```ts
import { buildConfig } from 'payload'
import { mediaGalleryPlugin } from '@sitebytom/payload-media-gallery'

export default buildConfig({
  // ...
  plugins: [
    mediaGalleryPlugin({
      collections: {
        media: true,
      },
      disabled: false,
    }),
  ],
})
```

> **IMPORTANT**
>
> This plugin is an **experimental** concept that implements a personal vision for the media gallery in Payload CMS. It currently only applies to the **"All Media"** view and is provided "as-is" with no expectation of active maintenance or support.
>
> **Known Limitation**: There is currently no component view hook available for the specific "Folders" view in Payload, so this gallery interface will not appear when browsing folder contents.
>
> Tested on **Payload 3.73.0** / **Next.js 16.1.4** / **React 19.2.3**
