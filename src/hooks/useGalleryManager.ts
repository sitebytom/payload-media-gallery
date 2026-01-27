'use client'

import { useSelection } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import type React from 'react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'

type UseGalleryManagerProps = {
  // biome-ignore lint/suspicious/noExplicitAny: generic doc
  docs: any[]
  slug: string
  // calculateNextIndex allows varying navigation logic (e.g. grid vs masonry)
  calculateNextIndex?: (current: number, key: string, total: number, columns?: number) => number
  onQuickEdit?: (id: string | number) => void
  onLightbox?: (index: number) => void
  columns?: number
  containerRef?: React.RefObject<HTMLDivElement | null>
}

export const useGalleryManager = ({
  docs,
  slug,
  calculateNextIndex,
  onQuickEdit,
  onLightbox,
  columns = 1,
  containerRef: providedRef,
}: UseGalleryManagerProps) => {
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
    // biome-ignore lint/suspicious/noExplicitAny: generic doc
    (event: React.MouseEvent | React.KeyboardEvent, doc: any, index: number) => {
      const isShift = event.shiftKey
      const isCmd = event.metaKey || event.ctrlKey || event.type === 'keydown'

      if (isCmd || isShift) {
        event.preventDefault()
        event.stopPropagation()

        // If Shift is pressed but we have no starting point, treat it as a Cmd click
        if (isCmd || (isShift && lastClickedIndex === null)) {
          toggleSelection(doc.id, index)
        } else if (isShift && lastClickedIndex !== null && docs) {
          const start = Math.min(lastClickedIndex, index)
          const end = Math.max(lastClickedIndex, index)

          // Determine the target state based on the clicked item's current state
          const currentlySelected = isIdSelected(doc.id)
          const targetState = !currentlySelected

          // We select/deselect the range to match the target state.
          // Note: Since we are calling setSelection in a loop, we rely on Payload's
          // selection manager to handle these safely. If it's a simple toggle,
          // we only call it for items that don't match the target state.
          for (let i = start; i <= end; i++) {
            const item = docs[i]
            if (isIdSelected(item.id) !== targetState) {
              // We don't update lastClickedIndex inside the loop
              const idStr = String(item.id)
              const idNum = Number(item.id)
              const hasNumberParams = typeof item.id === 'number' || !Number.isNaN(idNum)

              if (selected.get(idStr) === true) {
                setSelection(idStr)
              } else if (hasNumberParams && selected.get(idNum) === true) {
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
    // biome-ignore lint/suspicious/noExplicitAny: generic doc
    (event: React.MouseEvent, doc: any, index: number) => {
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

      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        nextIndex = calc(current, e.key, total, columns)
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
        if (current !== null) router.push(`/admin/collections/${slug}/${docs[current].id}`)
        return
      }

      if (nextIndex !== current) {
        setFocusedIndex(nextIndex)
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

  // Helper Props Generators
  const getItemProps = useCallback(
    // biome-ignore lint/suspicious/noExplicitAny: generic doc
    (doc: any, index: number) => ({
      doc,
      index,
      slug,
      focusedIndex,
      isSelected: isIdSelected(doc.id),
      selectedCount: count,
      onOnClick: handleOnClick,
      onOnMouseDown: handleOnMouseDown,
      onQuickEdit: (e: React.MouseEvent, id: string | number) => {
        e.preventDefault()
        e.stopPropagation()
        onQuickEdit?.(id)
      },
      onSelectionChange: (id: string | number) => toggleSelection(id, index),
      onLightbox: onLightbox || (() => {}),
      onFocus: handleFocus,
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
    ],
  )

  return {
    handleKeyDown,
    getItemProps,
  }
}
