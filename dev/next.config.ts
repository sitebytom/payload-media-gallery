import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(import.meta.dirname, '..'),
  },
  transpilePackages: ['payload-media-gallery', '@sitebytom/use-zoom-pan'],
}

export default withPayload(nextConfig)
