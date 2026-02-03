import { useCallback, useEffect, useRef, useState } from 'react'
import type { MediaItem } from '../types'

export interface MarqueeState {
  x: number
  y: number
  width: number
  height: number
  active: boolean
}

interface UseMarqueeProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  items: MediaItem[]
  onSelectionChange: (ids: (string | number)[], append: boolean) => void
  onSelectionEnd?: (ids: (string | number)[], append: boolean) => void
  enabled?: boolean
}

export const useMarquee = ({
  containerRef,
  items,
  onSelectionChange,
  onSelectionEnd,
  enabled = true,
}: UseMarqueeProps) => {
  const [marquee, setMarquee] = useState<MarqueeState>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    active: false,
  })
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const itemRects = useRef<{ id: string | number; rect: DOMRect }[]>([])
  const lastSelectedIds = useRef<(string | number)[]>([])
  const lastAppend = useRef<boolean>(false)
  const dragStartedOnCard = useRef<boolean>(false)

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!enabled || e.button !== 0) return

      const target = e.target as HTMLElement

      // 1. Exclude specific interactive controls
      const isControl = target.closest(
        'button, input, .media-gallery-grid__checkbox, .media-gallery-grid__controls',
      )
      if (isControl) return

      // 2. Identify if we are starting in a valid area
      // We want to allow starting in gutters or the general list wrapper
      // .template-default__wrap wraps the entire view, so it covers gutters/list-wrap too.
      const isValidArea = target.closest('.template-default__wrap')
      const isHeaderOrControls = target.closest('.list-header, .list-controls')
      const isCard = target.closest('.media-gallery-grid__item')

      // If we are in the header/controls, don't start
      if (isHeaderOrControls) return

      // If we are NOT in a gutter/card/container, don't start
      // This prevents starting marquee on sidebars or other UI elements
      if (!isValidArea && !isCard && !containerRef.current?.contains(target)) return

      startPos.current = { x: e.clientX, y: e.clientY }
      dragStartedOnCard.current = !!isCard

      // Cache item rects relative to document
      const container = containerRef.current
      if (!container) return

      const scrollX = window.scrollX
      const scrollY = window.scrollY
      const cardElements = container.querySelectorAll('.media-gallery-grid__item-wrapper')
      itemRects.current = Array.from(cardElements).map((el, index) => {
        const item = items[index]
        const rect = el.getBoundingClientRect()
        return {
          id: item.id,
          rect: new DOMRect(rect.x + scrollX, rect.y + scrollY, rect.width, rect.height),
        }
      })

      lastSelectedIds.current = []
      lastAppend.current = e.shiftKey || e.metaKey || e.ctrlKey
      // Don't set active: true yet, wait for movement
    },
    [enabled, containerRef, items],
  )

  const scrollInterval = useRef<number | null>(null)

  const stopAutoScroll = useCallback(() => {
    if (scrollInterval.current) {
      cancelAnimationFrame(scrollInterval.current)
      scrollInterval.current = null
    }
  }, [])

  const startAutoScroll = useCallback(
    (velocityY: number) => {
      stopAutoScroll()
      const scroll = () => {
        window.scrollBy(0, velocityY)
        scrollInterval.current = requestAnimationFrame(scroll)
      }
      scrollInterval.current = requestAnimationFrame(scroll)
    },
    [stopAutoScroll],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!startPos.current) return

      const threshold = 5
      const distance = Math.sqrt(
        (e.clientX - startPos.current.x) ** 2 + (e.clientY - startPos.current.y) ** 2,
      )

      if (!marquee.active && distance < threshold) return

      // Viewport-relative for rendering (fixed position)
      const clientX = e.clientX
      const clientY = e.clientY
      const startClientX = startPos.current.x
      const startClientY = startPos.current.y

      setMarquee({
        x: Math.min(clientX, startClientX),
        y: Math.min(clientY, startClientY),
        width: Math.abs(clientX - startClientX),
        height: Math.abs(clientY - startClientY),
        active: true,
      })

      // Document-relative for intersection
      const pageX = e.pageX
      const pageY = e.pageY
      const x = Math.min(pageX, startPos.current.x + window.scrollX)
      const y = Math.min(pageY, startPos.current.y + window.scrollY)
      const width = Math.abs(pageX - (startPos.current.x + window.scrollX))
      const height = Math.abs(pageY - (startPos.current.y + window.scrollY))

      // Auto-scroll logic
      const scrollThreshold = 50
      const topDist = e.clientY
      const botDist = window.innerHeight - e.clientY

      if (topDist < scrollThreshold) {
        startAutoScroll(-Math.max(2, (scrollThreshold - topDist) / 2))
      } else if (botDist < scrollThreshold) {
        startAutoScroll(Math.max(2, (scrollThreshold - botDist) / 2))
      } else {
        stopAutoScroll()
      }

      // Find intersecting items
      const selectedIds = itemRects.current
        .filter(({ rect }) => {
          return x < rect.right && x + width > rect.left && y < rect.bottom && y + height > rect.top
        })
        .map((i) => i.id)

      const isAppend = e.shiftKey || e.metaKey || e.ctrlKey
      lastSelectedIds.current = selectedIds
      lastAppend.current = isAppend
      onSelectionChange(selectedIds, isAppend)
    },
    [onSelectionChange, startAutoScroll, stopAutoScroll, marquee.active],
  )

  const handleMouseUp = useCallback(() => {
    if (startPos.current) {
      // Only fire selection end if marquee was actually active (we were dragging)
      if (marquee.active && onSelectionEnd) {
        onSelectionEnd(lastSelectedIds.current, lastAppend.current)
      }
    }
    startPos.current = null
    itemRects.current = []
    stopAutoScroll()
    setMarquee((prev) => ({ ...prev, active: false }))
  }, [stopAutoScroll, onSelectionEnd, marquee.active])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    const handleDragStart = (e: DragEvent) => {
      // Prevent native drag if we are potentially marquee selecting
      // Since we disable draggable on cards/images, this might already be handled
      // but as a fallback:
      e.preventDefault()
    }

    container.addEventListener('dragstart', handleDragStart)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('dragstart', handleDragStart)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [containerRef, enabled, handleMouseDown, handleMouseMove, handleMouseUp])

  // Prevent text selection while dragging
  useEffect(() => {
    if (marquee.active) {
      document.body.style.userSelect = 'none'
      document.body.style.webkitUserSelect = 'none'
    } else {
      document.body.style.userSelect = ''
      document.body.style.webkitUserSelect = ''
    }

    return () => {
      document.body.style.userSelect = ''
      document.body.style.webkitUserSelect = ''
    }
  }, [marquee.active])

  return marquee
}
