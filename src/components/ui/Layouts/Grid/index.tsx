import { useCallback, useRef } from 'react'
import { useGalleryManager } from '../../hooks/useGalleryManager'
import { MediaCard } from '../../MediaCard'
import type { GridProps } from './types'
import './index.scss'

export const Grid = ({
  onQuickEdit,
  items,
  onLightbox,
  handleSelection,
  footer,
  collectionLabel,
}: GridProps) => {
  const gridRef = useRef<HTMLDivElement>(null)

  const calculateNextIndex = useCallback((current: number, key: string, total: number) => {
    const grid = gridRef.current
    if (!grid) return current
    const computedStyle = window.getComputedStyle(grid)
    const gridTemplateColumns = computedStyle.getPropertyValue('grid-template-columns')
    const columns = gridTemplateColumns.split(' ').length || 1

    switch (key) {
      case 'ArrowRight':
        return Math.min(total - 1, current + 1)
      case 'ArrowLeft':
        return Math.max(0, current - 1)
      case 'ArrowDown':
        return Math.min(total - 1, current + columns)
      case 'ArrowUp':
        return Math.max(0, current - columns)
      default:
        return current
    }
  }, [])

  const { getItemProps } = useGalleryManager({
    docs: items,
    calculateNextIndex,
    containerRef: gridRef,
    onQuickEdit,
    onLightbox,
    handleSelection,
  })

  return (
    // biome-ignore lint/a11y/useSemanticElements: using div for grid layout
    <div className="item-card-grid media-gallery-grid" role="grid" ref={gridRef}>
      {items.map((item, i) => (
        <MediaCard
          key={item.id}
          {...getItemProps(item, i)}
          item={item}
          footer={footer}
          collectionLabel={collectionLabel}
          lightboxEnabled={!!onLightbox}
        />
      ))}
    </div>
  )
}
