import type { Config } from 'payload'
import type { MediaGalleryPluginOptions } from './types.js'

/**
 * A Payload CMS plugin that adds a Gallery View toggle to the List View of any Media collection.
 */
export const mediaGalleryPlugin =
  (options: MediaGalleryPluginOptions = {}) =>
  (config: Config): Config => {
    const { collections = ['media'], disabled = false } = options

    if (disabled) {
      return config
    }

    const enabledCollections = Array.isArray(collections)
      ? collections
      : Object.keys(collections).filter((slug) => collections[slug])

    return {
      ...config,
      collections: (config.collections || []).map((collection) => {
        if (enabledCollections.includes(collection.slug)) {
          return {
            ...collection,
            admin: {
              ...collection.admin,
              components: {
                ...(collection.admin?.components || {}),
                views: {
                  ...(collection.admin?.components?.views || {}),
                  list: {
                    ...(collection.admin?.components?.views?.list || {}),
                    // Direct component reference for better type safety and bundling
                    Component: '@sitebytom/payload-media-gallery/client#MediaListView',
                    // If using locally (e.g. copied to /src/plugins/media-gallery), use:
                    // Component: '@/plugins/payload-media-gallery/components/MediaListView#MediaListView',
                  },
                },
              },
            },
          }
        }
        return collection
      }),
    }
  }
