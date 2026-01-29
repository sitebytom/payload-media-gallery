import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import config from './src/payload.config'

let payload: Payload

afterAll(async () => {
  await payload.destroy()
})

beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('Media Gallery Plugin', () => {
  test('plugin should load and collections should exist', async () => {
    // Verify media collection exists and is accessible
    expect(payload.collections.media).toBeDefined()

    // Create a media item to ensure db works
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: 'Test Image',
      },
      filePath: './dev/src/seed-assets/seed-image-1.webp', // Assuming we can use seed asset or mock
    })
    expect(media.id).toBeDefined()
  })
})
