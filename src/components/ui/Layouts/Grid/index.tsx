import { closestCenter, DndContext } from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { useConfig } from '@payloadcms/ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGalleryManager } from '../../hooks/useGalleryManager'
import { useGalleryOrder } from '../../hooks/useGalleryOrder'
import { MediaCard } from '../../MediaCard'
import { MarqueeBox } from '../../Selection/MarqueeBox'
import { SortableItem } from '../../Sortable/SortableItem'
import type { GridProps } from './types'
import './index.scss'

export const Grid = ({
  onQuickEdit,
  items: initialItems,
  onLightbox,
  handleSelection,
  footer,
  collectionLabel,
  collectionSlug,
}: GridProps) => {
  const gridRef = useRef<HTMLDivElement>(null)
  const { config } = useConfig()

  const collectionConfig = config.collections.find((c) => c.slug === collectionSlug)
  const orderableEnabled =
    !!collectionConfig?.orderable ||
    !!(collectionConfig?.upload as unknown as { orderable?: boolean })?.orderable

  // Optimistic items state
  const [items, setItems] = useState(initialItems)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const { sensors, handleDragStart, handleDragEnd } = useGalleryOrder({
    items,
    collectionSlug,
    onOrder: setItems,
  })

  // We only enable DnD if configured
  const enableDnD = orderableEnabled

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

  const { getItemProps, marquee } = useGalleryManager({
    docs: items,
    calculateNextIndex,
    containerRef: gridRef,
    onQuickEdit,
    onLightbox,
    handleSelection,
  })

  const content = (
    <>
      <MarqueeBox marquee={marquee} />
      {items.map((item, i) => {
        const card = (
          <MediaCard
            key={item.id}
            {...getItemProps(item, i)}
            item={item}
            footer={footer}
            collectionLabel={collectionLabel}
            lightboxEnabled={!!onLightbox}
            // Pass drag handle capability if enabled
            // The SortableItem will stick `dragAttributes` and `dragListeners`
            // onto the child if it's a valid element.
          />
        )

        if (enableDnD) {
          return (
            <SortableItem key={item.id} id={item.id}>
              {card}
            </SortableItem>
          )
        }

        return card
      })}
    </>
  )

  if (enableDnD) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          {/* biome-ignore lint/a11y/useSemanticElements: using div for grid layout */}
          <div className="item-card-grid media-gallery-grid" role="grid" ref={gridRef}>
            {content}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: using div for grid layout
    <div className="item-card-grid media-gallery-grid" role="grid" ref={gridRef}>
      {content}
    </div>
  )
}
