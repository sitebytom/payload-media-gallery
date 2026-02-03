import { useSelection } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { MediaItem } from '../types'
import { useMarquee } from './useMarquee'

type GalleryManagerProps = {
  docs: MediaItem[]
  slug?: string
  // calculateNextIndex allows varying navigation logic (e.g. grid vs masonry)
  calculateNextIndex?: (current: number, key: string, total: number, columns?: number) => number
  onQuickEdit?: (id: string | number) => void
  onLightbox?: (index: number) => void
  handleSelection?: (item: MediaItem) => void
  columns?: number
  containerRef?: React.RefObject<HTMLDivElement | null>
}

export const useGalleryManager = ({
  docs,
  slug,
  calculateNextIndex,
  onQuickEdit,
  onLightbox,
  handleSelection,
  columns = 1,
  containerRef: providedRef,
}: GalleryManagerProps) => {
  const router = useRouter()
  const { selected, setSelection, count } = useSelection()

  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const internalRef = useRef<HTMLDivElement>(null)
  const containerRef = providedRef || internalRef

  const focusedIndexRef = useRef(focusedIndex)
  useLayoutEffect(() => {
    focusedIndexRef.current = focusedIndex
  }, [focusedIndex])

  const [marqueeIds, setMarqueeIds] = useState<Set<string | number>>(new Set())
  const [marqueeAppend, setMarqueeAppend] = useState(false)

  // Focus Management
  useLayoutEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    focusableElements.forEach((el) => {
      // Don't disable the main gallery item link, but do disable internal buttons
      // when we want to control focus purely via Arrow keys or when in selection mode
      if (
        !el.classList.contains('media-grid__item') &&
        (el.classList.contains('media-grid__expand-button') ||
          el.classList.contains('media-grid__edit-button'))
      ) {
        el.setAttribute('tabindex', '-1')
      }
    })
  }, [docs])

  // Selection Logic
  const isIdSelected = useCallback(
    (id: number | string) => {
      if (selected.get(id) === true) return true
      if (typeof id === 'number' && selected.get(String(id)) === true) return true
      const num = Number(id)
      if (typeof id === 'string' && !Number.isNaN(num) && selected.get(num) === true) return true
      return false
    },
    [selected],
  )

  const toggleSelection = useCallback(
    (id: number | string, index?: number) => {
      const idStr = String(id)
      const idNum = Number(id)
      const hasNumberParams = typeof id === 'number' || !Number.isNaN(idNum)

      const hasStr = selected.get(idStr) === true
      const hasNum = hasNumberParams && selected.get(idNum) === true

      if (index !== undefined) {
        setLastClickedIndex(index)
      }

      if (hasStr) {
        setSelection(idStr)
        return
      }
      if (hasNum) {
        setSelection(idNum)
        return
      }
      setSelection(idStr)
    },
    [selected, setSelection],
  )

  const handleItemSelection = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent, doc: MediaItem, index: number) => {
      const isShift = event.shiftKey
      const isCmd = event.metaKey || event.ctrlKey || event.type === 'keydown'

      if (isCmd || isShift) {
        if (event.preventDefault) event.preventDefault()
        if (event.stopPropagation) event.stopPropagation()

        // Determine anchor point: last clicked or currently focused
        const anchorIndex = lastClickedIndex !== null ? lastClickedIndex : focusedIndexRef.current

        // If Shift is pressed but we have no starting point, treat it as a Cmd click
        if (isCmd || (isShift && anchorIndex === null)) {
          toggleSelection(doc.id, index)
        } else if (isShift && anchorIndex !== null && docs) {
          const start = Math.min(anchorIndex, index)
          const end = Math.max(anchorIndex, index)

          // Determine the target state based on the clicked item's current state
          // If the clicked item is NOT selected, we want to SELECT the range.
          const currentlySelected = isIdSelected(doc.id)
          const targetState = !currentlySelected

          for (let i = start; i <= end; i++) {
            const item = docs[i]
            if (isIdSelected(item.id) !== targetState) {
              const idStr = String(item.id)
              const idNum = Number(item.id)
              const hasNumberParams = typeof item.id === 'number' || !Number.isNaN(idNum)

              if (selected.has(idStr)) {
                setSelection(idStr)
              } else if (hasNumberParams && selected.has(idNum)) {
                setSelection(idNum)
              } else {
                setSelection(idStr)
              }
            }
          }
          setLastClickedIndex(index)
        }
      }
    },
    [isIdSelected, setSelection, selected, lastClickedIndex, docs, toggleSelection],
  )

  // Event Handlers
  const handleOnClick = useCallback(
    (event: React.MouseEvent, index: number) => {
      setFocusedIndex(index)
      // Only update lastClickedIndex on normal clicks to avoid
      // resetting the range anchor during a Shift-click sequence.
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
        setLastClickedIndex(index)
      } else {
        event.preventDefault()
      }
    },
    [setFocusedIndex, setLastClickedIndex],
  )

  const handleOnMouseDown = useCallback(
    (event: React.MouseEvent, doc: MediaItem, index: number) => {
      setFocusedIndex(index)
      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        handleItemSelection(event, doc, index)
      } else {
        // Even on a normal mouse down, we can anchor the selection
        setLastClickedIndex(index)
      }
    },
    [handleItemSelection],
  )

  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index)
  }, [])

  // Keyboard Navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return
      if (!docs?.length) return

      const current = focusedIndexRef.current ?? 0
      const total = docs.length
      let nextIndex = current

      // Default navigation if no custom calculator provided
      const defaultCalculator = (cur: number, key: string, tot: number, cols: number) => {
        switch (key) {
          case 'ArrowRight':
            return Math.min(tot - 1, cur + 1)
          case 'ArrowLeft':
            return Math.max(0, cur - 1)
          case 'ArrowDown':
            return Math.min(tot - 1, cur + cols)
          case 'ArrowUp':
            return Math.max(0, cur - cols)
          default:
            return cur
        }
      }

      const calc = calculateNextIndex || defaultCalculator

      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault()
        if (e.key === 'Home') {
          nextIndex = 0
        } else if (e.key === 'End') {
          nextIndex = total - 1
        } else {
          nextIndex = calc(current, e.key, total, columns)
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        // Select All behavior
        docs.forEach((doc) => {
          if (!isIdSelected(doc.id)) {
            setSelection(doc.id)
          }
        })
        return
      } else if (e.key === ' ') {
        e.preventDefault()
        if (current !== null) {
          handleItemSelection(
            // biome-ignore lint/suspicious/noExplicitAny: fake event
            { ...e, preventDefault: () => {}, stopPropagation: () => {}, metaKey: true } as any,
            docs[current],
            current,
          )
        }
        return
      } else if (e.key === 'Enter') {
        const doc = docs[current]
        if (current !== null) {
          if (doc.href) {
            router.push(doc.href)
          } else if (slug) {
            router.push(`/admin/collections/${slug}/${doc.id}`)
          }
        }
        return
      }

      if (nextIndex !== current) {
        setFocusedIndex(nextIndex)
        // Anchor the selection to the newly focused item if we were already in some state
        // This helps Shift+Click range selection from keyboard
        setLastClickedIndex(nextIndex)
      }
    },
    [docs, slug, columns, calculateNextIndex, handleItemSelection, router],
  )

  // Attach keydown listener automatically
  useLayoutEffect(() => {
    if (!docs?.length) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [docs, handleKeyDown])

  // Marquee Selection Logic
  const handleMarqueeUpdate = useCallback((ids: (string | number)[], append: boolean) => {
    setMarqueeIds(new Set(ids))
    setMarqueeAppend(append)
  }, [])

  const handleMarqueeEnd = useCallback(
    (ids: (string | number)[], append: boolean) => {
      setMarqueeIds(new Set())

      const targetSelected = new Set(ids)

      docs.forEach((doc) => {
        const isCurrentlySelected = isIdSelected(doc.id)
        const shouldBeSelected = targetSelected.has(doc.id) || (append && isCurrentlySelected)

        if (isCurrentlySelected !== shouldBeSelected) {
          setSelection(doc.id)
        }
      })
    },
    [docs, selected, setSelection],
  )

  const marquee = useMarquee({
    containerRef,
    items: docs,
    onSelectionChange: handleMarqueeUpdate,
    onSelectionEnd: handleMarqueeEnd,
    enabled: true,
  })

  // Helper Props Generators
  const getItemProps = useCallback(
    (doc: MediaItem, index: number) => ({
      doc,
      index,
      slug,
      focusedIndex,
      isSelected: (() => {
        if (marquee.active) {
          if (marqueeAppend) return isIdSelected(doc.id) || marqueeIds.has(doc.id)
          return marqueeIds.has(doc.id)
        }
        return isIdSelected(doc.id)
      })(),
      selectedCount: count,
      onOnClick: handleOnClick,
      onOnMouseDown: handleOnMouseDown,
      ...(onQuickEdit
        ? {
            onQuickEdit: (e: React.MouseEvent, id: string | number) => {
              e.preventDefault()
              e.stopPropagation()
              onQuickEdit(id)
            },
          }
        : {}),
      onSelectionChange: (id: string | number) => toggleSelection(id, index),
      onLightbox: onLightbox || (() => {}),
      onFocus: handleFocus,
      handleSelection,
    }),
    [
      slug,
      focusedIndex,
      isIdSelected,
      count,
      handleOnClick,
      handleOnMouseDown,
      onQuickEdit,
      onLightbox,
      toggleSelection,
      handleFocus,
      handleSelection,
    ],
  )

  return {
    handleKeyDown,
    getItemProps,
    marquee,
  }
}
