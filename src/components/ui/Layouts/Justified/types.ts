import type { MediaItem } from '../../types'

export interface JustifiedProps {
  onQuickEdit?: (id: string | number) => void
  items: MediaItem[]
  onLightbox?: (index: number) => void
  handleSelection?: (item: MediaItem) => void
  footer?: 'always' | 'hover'
  collectionLabel?: string
  collectionSlug: string
}

export interface InternalItem extends MediaItem {
  index: number
  ratio: number
}

export interface RowData {
  items: {
    item: MediaItem
    index: number
    width: number
    height: number
  }[]
  height: number
}
