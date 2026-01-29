'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGalleryManager } from '../hooks/useGalleryManager'
import { MediaGalleryItem } from './MediaGalleryItem'

interface RowData {
  items: {
    // biome-ignore lint/suspicious/noExplicitAny: generic doc
    doc: any
    index: number
    width: number
    height: number
  }[]
  height: number
}

export const MediaGalleryJustified = ({
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [rows, setRows] = useState<RowData[]>([])

  // Responsive observation
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Justified Layout Calculation
  useEffect(() => {
    if (!docs || containerWidth === 0) return

    const GAP = 4 // Gap between items in pixels
    const targetRowHeight = 300
    const calculatedRows: RowData[] = []
    let currentRow: typeof docs = []
    let currentAspectRatioSum = 0

    // biome-ignore lint/suspicious/noExplicitAny: generic doc
    docs.forEach((doc: any, index: number) => {
      let w = doc.width
      let h = doc.height

      // Fallback and Sanity Check
      if (!w || !h || w === 0 || h === 0) {
        if (doc.mimeType?.includes('video')) {
          w = 1280
          h = 720
        } else {
          w = 500
          h = 500
        }
      }

      // Clamp aspect ratio to avoid extremely narrow or wide items breaking layout
      const rawRatio = w / h
      const ratio = Math.max(0.2, Math.min(5.0, rawRatio))

      currentRow.push({ doc, index, ratio })
      currentAspectRatioSum += ratio

      // Check if this row is "full" enough
      const estimatedGapTotal = (currentRow.length - 1) * GAP
      const estimatedHeight = (containerWidth - estimatedGapTotal) / currentAspectRatioSum

      if (estimatedHeight <= targetRowHeight) {
        // Row is full (height shrank to target). Commit it.
        const gapTotal = (currentRow.length - 1) * GAP
        const availableWidth = containerWidth - gapTotal - 1 // -1 px safety buffer for rounding
        const finalHeight = Math.min(600, availableWidth / currentAspectRatioSum)

        calculatedRows.push({
          height: finalHeight,
          // biome-ignore lint/suspicious/noExplicitAny: dynamic
          items: currentRow.map((item: { doc: any; index: number; ratio: number }) => ({
            doc: item.doc,
            index: item.index,
            width: item.ratio * finalHeight,
            height: finalHeight,
          })),
        })

        currentRow = []
        currentAspectRatioSum = 0
      }
    })

    // Handle last row (orphan)
    if (currentRow.length > 0) {
      // Use target height, don't justify/stretch
      calculatedRows.push({
        height: targetRowHeight,
        // biome-ignore lint/suspicious/noExplicitAny: dynamic
        items: currentRow.map((item: { doc: any; index: number; ratio: number }) => ({
          doc: item.doc,
          index: item.index,
          width: item.ratio * targetRowHeight,
          height: targetRowHeight,
        })),
      })
    }

    setRows(calculatedRows)
  }, [docs, containerWidth])

  // Navigation Logic
  const calculateNextIndex = useCallback(
    (current: number, key: string, total: number) => {
      if (key === 'ArrowRight') return Math.min(total - 1, current + 1)
      if (key === 'ArrowLeft') return Math.max(0, current - 1)

      // Find current position in grid structure
      let currentRowIdx = -1
      let currentColIdx = -1
      let found = false

      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].items.length; c++) {
          if (rows[r].items[c].index === current) {
            currentRowIdx = r
            currentColIdx = c
            found = true
            break
          }
        }
        if (found) break
      }

      if (!found) return current

      const GAP = 4

      // Helper to calculate item center X relative to row start
      const getItemCenterX = (row: RowData, colIdx: number) => {
        let x = 0
        for (let i = 0; i < colIdx; i++) {
          x += row.items[i].width + GAP
        }
        return x + row.items[colIdx].width / 2
      }

      // Helper to find closest item in target row
      const findClosestInRow = (row: RowData, targetX: number) => {
        let closestDist = Number.POSITIVE_INFINITY
        let closestIndex = row.items[0].index

        let currentX = 0
        for (const item of row.items) {
          const itemCenterX = currentX + item.width / 2
          const dist = Math.abs(itemCenterX - targetX)

          if (dist < closestDist) {
            closestDist = dist
            closestIndex = item.index
          }

          currentX += item.width + GAP
        }
        return closestIndex
      }

      if (key === 'ArrowUp') {
        if (currentRowIdx > 0) {
          const targetX = getItemCenterX(rows[currentRowIdx], currentColIdx)
          return findClosestInRow(rows[currentRowIdx - 1], targetX)
        }
        return current // Stay on first row
      }

      if (key === 'ArrowDown') {
        if (currentRowIdx < rows.length - 1) {
          const targetX = getItemCenterX(rows[currentRowIdx], currentColIdx)
          return findClosestInRow(rows[currentRowIdx + 1], targetX)
        }
        return current // Stay on last row
      }

      return current
    },
    [rows],
  )

  const { getItemProps } = useGalleryManager({
    docs: docs || [],
    slug,
    calculateNextIndex,
    containerRef,
    onQuickEdit,
    onLightbox,
    columns: 4, // dummy value, calculateNextIndex handles this
  })

  return (
    <div className="media-grid media-justified-js" ref={containerRef} style={{ width: '100%' }}>
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            height: row.height,
            marginBottom: '4px',
            width: '100%',
            gap: '4px', // Use flex gap
            flexWrap: 'nowrap',
          }}
        >
          {row.items.map(({ doc, index, width, height }) => (
            <div
              key={doc.id}
              style={{
                width: width,
                height: height,
              }}
            >
              <MediaGalleryItem
                {...getItemProps(doc, index)}
                // Force items to fill the calculated space
                // MediaGalleryCard needs to be flexible
                useOriginal={false} // Use thumbnails
                variant="overlay"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
