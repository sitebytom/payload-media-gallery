import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryServer } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { mediaGalleryPlugin } from '../../src/index'
import { testEmailAdapter } from './testEmailAdapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

// Declare global for MongoMemoryServer to prevent multiple instances during dev hot reloads
declare global {
  var _mongoMemoryServer: MongoMemoryServer | undefined
}

const buildConfigWithMemoryDB = async () => {
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    // Increase timeout to avoid startup failures
    process.env.MONGOMS_LAUNCH_TIMEOUT = '30000'

    if (!global._mongoMemoryServer) {
      global._mongoMemoryServer = await MongoMemoryServer.create()
      console.log('✅ Created new MongoMemoryServer instance')
    }

    process.env.DATABASE_URI = global._mongoMemoryServer.getUri()
  }

  return buildConfig({
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: 'media',
        folders: true,
        upload: {
          // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
          staticDir: path.resolve(dirname, '../public/media'),
          adminThumbnail: 'thumbnail',
          focalPoint: true,
          imageSizes: [
            {
              name: 'thumbnail',
              width: 300,
            },
            {
              name: 'square',
              width: 500,
              height: 500,
            },
            {
              name: 'small',
              width: 600,
            },
            {
              name: 'medium',
              width: 900,
            },
            {
              name: 'large',
              width: 1400,
            },
            {
              name: 'xlarge',
              width: 1920,
            },
            {
              name: 'og',
              width: 1200,
              height: 630,
              crop: 'center',
            },
          ],
        },
        fields: [
          {
            name: 'alt',
            type: 'text',
          },
        ],
      },
    ],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: mongooseAdapter({
      url: process.env.DATABASE_URI || '',
    }),
    sharp,
    email: testEmailAdapter,
    plugins: [
      mediaGalleryPlugin({
        disabled: false, // Optional
        collections: {
          media: true, // Enable for specific collections
        },
      }),
    ],
    onInit: async (payload) => {
      const { seed } = await import('./seed')
      await seed(payload)
    },
  })
}

export default buildConfigWithMemoryDB()
