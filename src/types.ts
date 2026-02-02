import type { ViewType } from './components/ui/Layouts/registry.js'

export interface PluginOptions {
  /**
   * Collections to enable the gallery view for.
   * Can be an array of collection slugs, e.g. ['media']
   * Or an object with collection slugs as keys and boolean true to enable.
   * Defaults to ['media']
   */
  collections?: string[] | Partial<Record<string, true>>

  /**
   * Whether the plugin is disabled or not.
   * Defaults to false.
   */
  disabled?: boolean

  /**
   * The initial view mode to use when no user preference exists.
   * Defaults to 'list'.
   */
  defaultView?: ViewType

  /**
   * Configure which layouts are available and their display settings.
   */
  layouts?: Partial<
    Record<
      ViewType,
      | boolean
      | {
          enabled?: boolean
          footer?: 'always' | 'hover'
        }
    >
  >

  /**
   * Whether to enable the lightbox gallery.
   * Defaults to true.
   */
  lightbox?: boolean

  /**
   * Whether to enable the quick edit button.
   * Defaults to true.
   */
  edit?: boolean
}
