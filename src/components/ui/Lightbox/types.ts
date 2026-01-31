import type { MediaItem } from '../types'

export type LightboxItem = MediaItem

export interface LightboxProps {
  items: LightboxItem[]
  initialIndex: number
  onClose: () => void
  onEdit?: (item: LightboxItem) => void
}
