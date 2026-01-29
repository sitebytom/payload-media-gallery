'use client'
import { useCallback, useRef } from 'react'
import { useGalleryManager } from '../../hooks/useGalleryManager'
import { Item } from './Item'

export const Grid = ({
  slug,
  onQuickEdit,
  docs,
  onLightbox,
}: {
  slug: string
  onQuickEdit: (id: string | number) => void
  // biome-ignore lint/suspicious/noExplicitAny: generic doc
  docs: any[]
  onLightbox: (index: number) => void
}) => {
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
    docs,
    slug,
    calculateNextIndex,
    containerRef: gridRef,
    onQuickEdit,
    onLightbox,
  })

  return (
    // biome-ignore lint/a11y/useSemanticElements: using div for grid layout
    <div className="item-card-grid media-gallery-grid" role="grid" ref={gridRef}>
      {docs.map((doc, i) => (
        <Item key={doc.id} {...getItemProps(doc, i)} />
      ))}
    </div>
  )
}
