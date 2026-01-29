import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const seed = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding data...')

  const existingUsers = await payload.find({
    collection: 'users',
    limit: 1,
  })

  if (existingUsers.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: 'dev@payloadcms.com',
        password: 'test',
      },
    })
    payload.logger.info('User created: dev@payloadcms.com / test')
  }

  const existingMedia = await payload.find({
    collection: 'media',
    limit: 1,
  })

  if (existingMedia.docs.length === 0) {
    const hiddenMediaDir = path.resolve(dirname, 'seed-assets')
    const publicMediaDir = path.resolve(dirname, '../public/media')

    // Seed media files
    const mediaFiles = [
      {
        alt: 'Seed Document',
        filename: 'seed-document.md',
      },
      {
        alt: 'Seed Audio',
        filename: 'seed-audio.mp3',
      },
      {
        alt: 'Seed Video',
        filename: 'seed-video.webm',
      },
      ...Array.from({ length: 10 }, (_, i) => ({
        alt: `Seed Image ${i + 1}`,
        filename: `seed-image-${i + 1}.webp`,
      })),
    ]

    for (const media of mediaFiles) {
      const targetFilePath = path.join(publicMediaDir, media.filename)

      // Clean up existing file if it exists to avoid Payload creating duplicates (e.g. seed-image-1-1.png)
      if (fs.existsSync(targetFilePath)) {
        fs.unlinkSync(targetFilePath)
      }

      await payload.create({
        collection: 'media',
        data: {
          alt: media.alt,
        },
        filePath: path.join(hiddenMediaDir, media.filename),
      })
    }

    payload.logger.info('Media seeded')
  }

  payload.logger.info('Seeding complete')
}
