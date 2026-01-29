import type { Config } from 'payload'
import { describe, expect, it } from 'vitest'
import { mediaGalleryPlugin } from '../src/index'

describe('mediaGalleryPlugin', () => {
  const getMockConfig = (): Config =>
    ({
      collections: [
        {
          slug: 'media',
          admin: {
            components: {},
          },
        },
      ],
    }) as Config

  it('should enable plugin by default', () => {
    const plugin = mediaGalleryPlugin()
    const result = plugin(getMockConfig())
    const mediaCollection = result.collections?.find((c) => c.slug === 'media')
    expect(mediaCollection?.admin?.components?.views?.list?.Component).toContain('ListView')
  })

  it('should disable plugin when disabled is true', () => {
    const plugin = mediaGalleryPlugin({ disabled: true })
    const result = plugin(getMockConfig())
    const mediaCollection = result.collections?.find((c) => c.slug === 'media')
    expect(mediaCollection?.admin?.components?.views?.list).toBeUndefined()
  })

  it('should support object syntax for collections', () => {
    const plugin = mediaGalleryPlugin({
      collections: {
        media: true,
      },
    })
    const result = plugin(getMockConfig())
    const mediaCollection = result.collections?.find((c) => c.slug === 'media')
    expect(mediaCollection?.admin?.components?.views?.list?.Component).toContain('ListView')
  })
})
