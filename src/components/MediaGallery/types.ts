import type { ListViewClientProps } from 'payload'
import type { PluginOptions } from '../../types'
import type { ViewType } from '../ui/Layouts/registry'

export interface MediaGalleryProps extends Record<string, unknown>, ListViewClientProps {
  collectionConfig?: {
    slug: string
    [key: string]: unknown
  }
  listProps?: {
    handleSelection?: (id: string | number) => void
    onSelect?: (args: unknown) => void
    onRowClick?: (id: string | number) => void
    [key: string]: unknown
  }
  drawerProps?: {
    handleSelection?: (id: string | number) => void
    onSelect?: (args: unknown) => void
    [key: string]: unknown
  }
  handleSelection?: (id: string | number) => void
  onSelect?: (args: unknown) => void
  onRowClick?: (id: string | number) => void
  /**
   * Initial view mode if no user preference is found.
   */
  defaultView?: ViewType
  /**
   * Layout configuration (enabled/disabled and footer mode).
   */
  layouts?: PluginOptions['layouts']
  /**
   * Whether to enable the lightbox.
   */
  lightbox?: boolean
  /**
   * Whether to enable quick edit.
   */
  edit?: boolean
}

export interface PayloadMediaDoc {
  id: string | number
  filename: string
  mimeType?: string
  url: string
  sizes?: {
    thumbnail?: {
      url?: string
      width?: number
      height?: number
    }
    [key: string]: { url?: string; width?: number; height?: number } | undefined
  }
  alt?: string
  width?: number
  height?: number
  focalX?: number
  focalY?: number
}
