'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Position {
  x: number
  y: number
}

interface ZoomPanProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  isImage: boolean
  onNext?: () => void
  onPrev?: () => void
}

export const useZoomPan = ({ containerRef, isImage, onNext, onPrev }: ZoomPanProps) => {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const dragStartRef = useRef({ x: 0, y: 0, hasDragged: false, startX: 0, startY: 0 })
  const pinchRef = useRef({
    startDist: 0,
    initialScale: 1,
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
  })

  // Track state for stable event listeners (non-passive wheel)
  const stateRef = useRef({ scale, position, isImage })
  useEffect(() => {
    stateRef.current = { scale, position, isImage }
  }, [scale, position, isImage])

  const calculateBounds = useCallback(
    (targetScale: number, imgElement: HTMLImageElement) => {
      const container = containerRef.current
      if (!container) return { xLimit: 0, yLimit: 0 }

      const cw = container.clientWidth
      const ch = container.clientHeight
      const iw = imgElement.offsetWidth || cw
      const ih = imgElement.offsetHeight || ch

      const scaledW = iw * targetScale
      const scaledH = ih * targetScale

      const BOUNDS_BUFFER = 80
      const xLimit = (scaledW <= cw ? 0 : (scaledW - cw) / 2) + BOUNDS_BUFFER
      const yLimit = (scaledH <= ch ? 0 : (scaledH - ch) / 2) + BOUNDS_BUFFER

      return { xLimit, yLimit }
    },
    [containerRef],
  )

  const handleWheelManual = useCallback(
    (e: WheelEvent) => {
      if (!stateRef.current.isImage) return

      e.preventDefault()

      const { scale: currentScale, position: currentPosition } = stateRef.current
      const delta = e.deltaY * -0.002
      const newScale = Math.min(Math.max(1, currentScale + delta), 4)

      if (newScale === 1) {
        setScale(1)
        setPosition({ x: 0, y: 0 })
      } else {
        const container = containerRef.current
        const img = container?.querySelector('.media-gallery-lightbox__image') as HTMLImageElement
        if (container && img) {
          const rect = container.getBoundingClientRect()
          const cw = container.clientWidth
          const ch = container.clientHeight
          const cx = cw / 2
          const cy = ch / 2

          const mouseX = e.clientX - (rect.left + cx)
          const mouseY = e.clientY - (rect.top + cy)

          const imgX = (mouseX - currentPosition.x) / currentScale
          const imgY = (mouseY - currentPosition.y) / currentScale

          let newX = mouseX - imgX * newScale
          let newY = mouseY - imgY * newScale

          const { xLimit, yLimit } = calculateBounds(newScale, img)
          newX = Math.max(-xLimit, Math.min(xLimit, newX))
          newY = Math.max(-yLimit, Math.min(yLimit, newY))

          setPosition({ x: newX, y: newY })
        }
      }
      setScale(newScale)
    },
    [calculateBounds, containerRef],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheelManual, { passive: false })
    return () => container.removeEventListener('wheel', handleWheelManual)
  }, [containerRef, handleWheelManual])

  const reset = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsDragging(false)
  }, [])

  const handleFocalZoom = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      const viewportCenterX = window.innerWidth / 2
      const viewportCenterY = window.innerHeight / 2
      const mouseX = e.clientX - viewportCenterX
      const mouseY = e.clientY - viewportCenterY

      const newScale = 2.5
      let newX = mouseX * (1 - newScale)
      let newY = mouseY * (1 - newScale)

      const { xLimit, yLimit } = calculateBounds(newScale, e.currentTarget)
      newX = Math.max(-xLimit, Math.min(xLimit, newX))
      newY = Math.max(-yLimit, Math.min(yLimit, newY))

      setScale(newScale)
      setPosition({ x: newX, y: newY })
    },
    [calculateBounds],
  )

  const onImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (dragStartRef.current.hasDragged) {
      dragStartRef.current.hasDragged = false
      return
    }

    if (scale > 1) {
      reset()
    } else {
      handleFocalZoom(e)
    }
  }

  const onImageDoubleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (scale > 1) {
      reset()
    } else {
      handleFocalZoom(e)
    }
  }

  const onImageTouchStart = (e: React.TouchEvent<HTMLImageElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2

      pinchRef.current = {
        startDist: dist,
        initialScale: scale,
        startX: cx,
        startY: cy,
        startPos: { x: position.x, y: position.y },
      }
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true)
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
        hasDragged: false,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
      }
    }
  }

  const onImageTouchMove = (e: React.TouchEvent<HTMLImageElement>) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2

      const viewportCenterX = window.innerWidth / 2
      const viewportCenterY = window.innerHeight / 2
      const currentPinchX = cx - viewportCenterX
      const currentPinchY = cy - viewportCenterY
      const startPinchX = pinchRef.current.startX - viewportCenterX
      const startPinchY = pinchRef.current.startY - viewportCenterY

      const ratio = dist / pinchRef.current.startDist
      const newScale = Math.min(Math.max(1, pinchRef.current.initialScale * ratio), 4)

      let newX = 0
      let newY = 0

      if (newScale > 1) {
        const scaleRatio = newScale / pinchRef.current.initialScale
        const pImgX = startPinchX - pinchRef.current.startPos.x
        const pImgY = startPinchY - pinchRef.current.startPos.y

        newX = currentPinchX - pImgX * scaleRatio
        newY = currentPinchY - pImgY * scaleRatio

        const { xLimit, yLimit } = calculateBounds(newScale, e.currentTarget)
        newX = Math.max(-xLimit, Math.min(xLimit, newX))
        newY = Math.max(-yLimit, Math.min(yLimit, newY))
        setPosition({ x: newX, y: newY })
      } else {
        setPosition({ x: 0, y: 0 })
      }
      setScale(newScale)
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      e.preventDefault()
      const cx = e.touches[0].clientX
      const cy = e.touches[0].clientY

      if (!dragStartRef.current.hasDragged) {
        const moveDist = Math.hypot(
          cx - dragStartRef.current.startX,
          cy - dragStartRef.current.startY,
        )
        if (moveDist > 5) dragStartRef.current.hasDragged = true
      }

      if (dragStartRef.current.hasDragged) {
        let newX = cx - dragStartRef.current.x
        let newY = cy - dragStartRef.current.y

        const { xLimit, yLimit } = calculateBounds(scale, e.currentTarget)
        newX = Math.max(-xLimit, Math.min(xLimit, newX))
        newY = Math.max(-yLimit, Math.min(yLimit, newY))

        setPosition({ x: newX, y: newY })
      }
    }
  }

  const onImageMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (scale > 1) {
      e.preventDefault()
      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
        hasDragged: false,
        startX: e.clientX,
        startY: e.clientY,
      }
    }
  }

  const onImageMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isDragging && scale > 1) {
      e.preventDefault()
      const moveDist = Math.hypot(
        e.clientX - dragStartRef.current.startX,
        e.clientY - dragStartRef.current.startY,
      )
      if (moveDist > 5) dragStartRef.current.hasDragged = true

      if (dragStartRef.current.hasDragged) {
        let newX = e.clientX - dragStartRef.current.x
        let newY = e.clientY - dragStartRef.current.y

        const { xLimit, yLimit } = calculateBounds(scale, e.currentTarget)
        newX = Math.max(-xLimit, Math.min(xLimit, newX))
        newY = Math.max(-yLimit, Math.min(yLimit, newY))

        setPosition({ x: newX, y: newY })
      }
    }
  }

  const onContainerTouchStart = (e: React.TouchEvent) => {
    if (scale > 1) return
    const touch = e.changedTouches[0]
    // @ts-expect-error - storing internal state on DOM
    containerRef.current._touchStartX = touch.clientX
  }

  const onContainerTouchEnd = (e: React.TouchEvent) => {
    if (scale > 1) return
    const touch = e.changedTouches[0]
    // @ts-expect-error - retrieving internal state from DOM
    const startX = containerRef.current?._touchStartX
    const endX = touch.clientX
    const diff = startX - endX

    if (Math.abs(diff) > 50) {
      if (diff > 0) onNext?.()
      else onPrev?.()
    }
  }

  return {
    scale,
    position,
    isDragging,
    reset,
    imageProps: {
      onClick: onImageClick,
      onDoubleClick: onImageDoubleClick,
      onTouchStart: onImageTouchStart,
      onTouchMove: onImageTouchMove,
      onTouchEnd: () => setIsDragging(false),
      onMouseDown: onImageMouseDown,
      onMouseMove: onImageMouseMove,
      onMouseUp: () => setIsDragging(false),
      onMouseLeave: () => setIsDragging(false),
    },
    containerProps: {
      onTouchStart: onContainerTouchStart,
      onTouchEnd: onContainerTouchEnd,
    },
  }
}
