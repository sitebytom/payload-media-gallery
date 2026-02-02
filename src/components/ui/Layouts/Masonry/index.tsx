import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGalleryManager } from '../../hooks/useGalleryManager'
import { MediaCard } from '../../MediaCard'
import type { MediaItem } from '../../types'
import type { MasonryProps } from './types'
import './index.scss'

export const Masonry = ({
  onQuickEdit,
  items,
  onLightbox,
  handleSelection,
  footer,
  collectionLabel,
}: MasonryProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columnCount, setColumnCount] = useState(1)

  // Update column count based on container width
  useEffect(() => {
    if (!containerRef.current) return

    const updateColumns = () => {
      if (!containerRef.current) return
      const width = containerRef.current.offsetWidth
      if (width < 600) setColumnCount(1)
      else if (width < 900) setColumnCount(2)
      else if (width < 1200) setColumnCount(3)
      else if (width < 1600) setColumnCount(4)
      else setColumnCount(5)
    }

    updateColumns()
    const observer = new ResizeObserver(updateColumns)
    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  // Distribute items into columns (LTR order: index % colCount)
  const columns = useMemo(() => {
    const cols: MediaItem[][] = Array.from({ length: columnCount }, () => [])
    items.forEach((item, index) => {
      cols[index % columnCount].push(item)
    })
    return cols
  }, [items, columnCount])

  const calculateNextIndex = useCallback(
    (current: number, key: string, total: number) => {
      const cols = columnCount

      switch (key) {
        case 'ArrowRight':
          return Math.min(total - 1, current + 1)
        case 'ArrowLeft':
          return Math.max(0, current - 1)
        case 'ArrowDown':
          return Math.min(total - 1, current + cols)
        case 'ArrowUp':
          return Math.max(0, current - cols)
        default:
          return current
      }
    },
    [columnCount],
  )

  const { getItemProps } = useGalleryManager({
    docs: items,
    calculateNextIndex,
    containerRef,
    onQuickEdit,
    onLightbox,
    handleSelection,
    columns: columnCount,
  })

  return (
    <div className="media-gallery-masonry" ref={containerRef}>
      {columns.map((colItems, colIndex) => (
        <div key={colIndex} className="media-gallery-masonry__column">
          {colItems.map((item) => {
            const index = items.indexOf(item)
            return (
              <MediaCard
                key={item.id}
                {...getItemProps(item, index)}
                item={item}
                footer={footer}
                collectionLabel={collectionLabel}
                lightboxEnabled={!!onLightbox}
                className="masonry-item"
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
