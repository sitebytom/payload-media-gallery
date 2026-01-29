import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import fs from 'fs'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { mediaGalleryPlugin } from '../../src/index'
import { testEmailAdapter } from './testEmailAdapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const uriFile = path.resolve(dirname, '.tmp-db-uri')

const getDatabaseUri = async (): Promise<string> => {
  if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
    return process.env.DATABASE_URI || ''
  }

  // In development, we expect dev/server.js to have started the DB and written the URI
  // We poll for it briefly in case of startup race conditions
  const maxWait = 10000 // 10 seconds
  const start = Date.now()

  while (Date.now() - start < maxWait) {
    if (fs.existsSync(uriFile)) {
      const uri = fs.readFileSync(uriFile, 'utf-8').trim()
      if (uri) return uri
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(
    'Could not find MongoDB URI at ' +
      uriFile +
      '. Please make sure you are running via "pnpm dev".',
  )
}

const buildConfigWithMemoryDB = async () => {
  const databaseUri = typeof window === 'undefined' ? await getDatabaseUri() : ''

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
          staticDir: path.resolve(dirname, '../public/media'),
          adminThumbnail: 'thumbnail',
          focalPoint: true,
          imageSizes: [
            { name: 'thumbnail', width: 300 },
            { name: 'square', width: 500, height: 500 },
            { name: 'small', width: 600 },
            { name: 'medium', width: 900 },
            { name: 'large', width: 1400 },
            { name: 'xlarge', width: 1920 },
            { name: 'og', width: 1200, height: 630, crop: 'center' },
          ],
        },
        fields: [{ name: 'alt', type: 'text' }],
      },
    ],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    db: mongooseAdapter({
      url: databaseUri,
    }),
    sharp,
    email: testEmailAdapter,
    plugins: [
      mediaGalleryPlugin({
        disabled: false,
        collections: { media: true },
      }),
    ],
    onInit: async (payload) => {
      const { seed } = await import('./seed')
      await seed(payload)
    },
  })
}

export default buildConfigWithMemoryDB()
