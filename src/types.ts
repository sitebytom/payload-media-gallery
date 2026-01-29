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
}
