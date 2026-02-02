import type { ListViewClientProps } from 'payload'

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
