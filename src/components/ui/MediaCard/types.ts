import type React from 'react'
import type { MediaItem } from '../types'

export interface ItemProps {
  item: MediaItem
  index: number
  focusedIndex: number | null
  isSelected: boolean
  selectedCount: number
  onOnClick: (event: React.MouseEvent, index: number) => void
  onOnMouseDown: (event: React.MouseEvent, doc: MediaItem, index: number) => void
  onQuickEdit?: (e: React.MouseEvent, id: string | number) => void
  onLightbox: (index: number) => void
  onSelectionChange: (id: string | number) => void
  onFocus: (index: number) => void
  handleSelection?: (item: MediaItem) => void
  useOriginal?: boolean
  variant?: 'default' | 'overlay'
  className?: string
  collectionLabel?: string
  // Drag and Drop props
  dragAttributes?: Record<string, unknown>
  dragListeners?: Record<string, (...args: unknown[]) => unknown>
  isDragging?: boolean
}
