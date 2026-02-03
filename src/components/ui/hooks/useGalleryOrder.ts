import {
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useConfig, useLocale } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import type { MediaItem } from '../types'

interface UseGalleryOrderProps {
  items: MediaItem[]
  collectionSlug: string
  // Callback to update local state optimistically
  onOrder: (newItems: MediaItem[]) => void
}

export const useGalleryOrder = ({ items, collectionSlug, onOrder }: UseGalleryOrderProps) => {
  const { config } = useConfig()
  const { code } = useLocale()
  const router = useRouter()
  const [activeId, setActiveId] = useState<string | number | null>(null)

  const collectionConfig = config.collections.find((c) => c.slug === collectionSlug)
  // Strict check for orderable
  const isOrderableConfig = !!collectionConfig?.orderable

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags when clicking
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over || active.id === over.id) {
        return
      }

      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return

      // Optimistic update
      const newItems = arrayMove(items, oldIndex, newIndex)
      onOrder(newItems)

      // API Update Logic
      const movedItem = items[oldIndex]
      const targetItem = items[newIndex] // The item we dropped ONTO/Near

      // Payload always uses '_order' for orderable collections
      const orderField = '_order'

      const targetDoc = targetItem.originalData as Record<string, unknown>

      const targetOrderValue = targetDoc[orderField]

      const direction = newIndex > oldIndex ? 'greater' : 'less'

      // Guard against non-orderable collections
      if (!isOrderableConfig) {
        console.error(
          `Collection "${collectionSlug}" is not configured as "orderable". Cannot reorder.`,
        )
        onOrder(items)
        return
      }

      // Guard against missing sort values
      if (typeof targetOrderValue !== 'number' && typeof targetOrderValue !== 'string') {
        onOrder(items)
        return
      }

      try {
        const payload = {
          collectionSlug,
          docsToMove: [movedItem.id],
          target: {
            id: targetItem.id,
            key: targetOrderValue,
          },
          newKeyWillBe: direction,
          orderableFieldName: orderField,
        }

        // Handle locale being undefined or null
        const localeParam = code ? `?locale=${code}` : ''

        const response = await fetch(`${config.routes.api}/reorder${localeParam}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const text = await response.text()
          console.error('Reorder response details:', text)
          try {
            const json = JSON.parse(text)
            throw new Error(json.message || `Reorder failed with status: ${response.status}`)
          } catch {
            throw new Error(`Reorder failed: ${response.status} ${response.statusText}`)
          }
        } else {
          // Success: Refresh the route to ensure data consistency across views
          router.refresh()
        }
      } catch {
        console.error('Reorder error details: Reorder failed')
        onOrder(items) // Revert on failure
      }
    },
    [items, onOrder, collectionSlug, config.routes.api, code, isOrderableConfig, router],
  )

  return {
    sensors,
    handleDragStart,
    handleDragEnd,
    activeId,
  }
}
