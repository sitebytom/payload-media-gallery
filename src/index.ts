import type { Plugin } from 'payload'
import type { PluginOptions } from './types.js'

/**
 * A Payload CMS 3 plugin that enhances the Media List View with Grid, Masonry, and Lightbox views, including video previews.
 */
export const mediaGalleryPlugin =
  (options: PluginOptions = {}): Plugin =>
  (config) => {
    const {
      collections = ['media'],
      defaultView,
      layouts,
      lightbox = true,
      edit = true,
      disabled = false,
    } = options

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
                    Component: {
                      path: '@sitebytom/payload-media-gallery/client#MediaGallery',
                      clientProps: {
                        defaultView,
                        layouts,
                        lightbox,
                        edit,
                      },
                    },
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
