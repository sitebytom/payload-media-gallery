import type { MediaItem } from '../../types'

export interface GridProps {
  onQuickEdit: (id: string | number) => void
  items: MediaItem[]
  onLightbox: (index: number) => void
}
