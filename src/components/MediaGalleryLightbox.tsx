'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AudioIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  EditIcon,
  FileIcon,
  FullscreenIcon,
  GridViewIcon,
  PauseIcon,
  PlayIcon,
} from '../Icons'

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v']
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'wma', 'm4r', 'aiff', 'alac']
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp', 'ico', 'tiff']

const getMimeType = (filename?: string, docMimeType?: string) => {
  if (docMimeType) return docMimeType
  const ext = filename?.split('.').pop()?.toLowerCase() || ''
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image/' + ext
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video/' + ext
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio/' + ext
  return ''
}

export const MediaGalleryLightbox = ({
  docs,
  initialIndex,
  onClose,
  onQuickEdit,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: doc type is dynamic
  docs: any[]
  initialIndex: number
  onClose: () => void
  onQuickEdit: (id: string | number) => void
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const dragStartRef = useRef({ x: 0, y: 0, hasDragged: false, startX: 0, startY: 0 })
  const pinchRef = useRef({
    startDist: 0,
    initialScale: 1,
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
  })
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset zoom state when index changes
  useEffect(() => {
    // setIsLoading(true) // Removed to avoid race condition with ref callback
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsDragging(false)
  }, [currentIndex])

  // Focus management and mount animation
  useEffect(() => {
    setIsMounted(true)
    // Small timeout to ensure DOM is ready and previous focus events settle
    const timer = setTimeout(() => {
      containerRef.current?.focus()
    }, 50)

    document.body.classList.add('media-gallery-lightbox-open')

    return () => {
      clearTimeout(timer)
      document.body.classList.remove('media-gallery-lightbox-open')
    }
  }, [])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // Match CSS transition duration
  }, [onClose])

  const handleNext = useCallback(() => {
    setIsLoading(true)
    setCurrentIndex((prev) => (prev < docs.length - 1 ? prev + 1 : 0)) // Wrap around for slideshow
  }, [docs.length])

  const handlePrev = useCallback(() => {
    setIsLoading(true)
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : docs.length - 1)) // Wrap around
  }, [docs.length])

  // Preload next/prev images
  useEffect(() => {
    const preloadImage = (index: number) => {
      const doc = docs[index]
      if (!doc) return
      const mime = getMimeType(doc.filename, doc.mimeType)
      if (mime.startsWith('image/')) {
        const img = new Image()
        img.src = doc.url
      }
    }

    const nextIndex = currentIndex < docs.length - 1 ? currentIndex + 1 : 0
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : docs.length - 1

    preloadImage(nextIndex)
    preloadImage(prevIndex)
  }, [currentIndex, docs])

  // Slideshow logic
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isPlaying && !isLoading) {
      // Only start timer when loading is done
      timer = setTimeout(handleNext, 3000)
    }
    return () => clearTimeout(timer)
  }, [isPlaying, isLoading, handleNext])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
      // Prevent default browser scrolling/actions for these keys
      if (['ArrowRight', 'ArrowLeft', ' '].includes(e.key)) {
        e.preventDefault()
      }

      e.stopPropagation() // Stop bubbling to underlying app

      switch (e.key) {
        case 'ArrowRight':
          handleNext()
          break
        case 'ArrowLeft':
          handlePrev()
          break
        case 'Escape':
          handleClose()
          break
        case ' ': // Space to toggle play/pause
          setIsPlaying((p) => !p)
          break
        case 'Tab': {
          const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), audio, video, [contenteditable]',
          )

          if (!focusable || focusable.length === 0) break

          const first = focusable[0]
          const last = focusable[focusable.length - 1]

          // If focus is outside, bring it in
          if (!containerRef.current?.contains(document.activeElement)) {
            e.preventDefault()
            first.focus()
            break
          }

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault()
              last.focus()
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault()
              first.focus()
            }
          }
          break
        }
      }
    },
    [handleNext, handlePrev, handleClose, onClose],
  )

  // Global listener for safety (in case focus is lost)
  useEffect(() => {
    const globalHandler = (e: KeyboardEvent) => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        handleKeyDown(e)
      }
    }
    window.addEventListener('keydown', globalHandler)
    return () => window.removeEventListener('keydown', globalHandler)
  }, [handleKeyDown])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen mode: ${e.message} (${e.name})`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const currentDoc = docs[currentIndex]
  if (!currentDoc) return null

  const mimeType = getMimeType(currentDoc.filename, currentDoc.mimeType)
  const isVideo = mimeType.startsWith('video/')
  const isAudio = mimeType.startsWith('audio/')
  const isImage = mimeType.startsWith('image/')
  const isDocument = !isVideo && !isAudio && !isImage

  const mediaUrl = currentDoc.url

  return (
    <div
      className={`media-gallery-lightbox ${isMounted ? 'media-gallery-lightbox--enter' : ''} ${isClosing ? 'media-gallery-lightbox--exit' : ''}`}
      ref={containerRef}
      tabIndex={-1} // Allow focus
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Media Lightbox"
    >
      <button
        type="button"
        className="media-gallery-lightbox__overlay"
        onClick={handleClose}
        aria-label="Close lightbox"
      />

      {/* Header Area (Absolute Top) */}
      <div className="media-gallery-lightbox__header">
        <div className="media-gallery-lightbox__header-left">
          <div className="media-gallery-lightbox__counter">
            {currentIndex + 1} / {docs.length}
          </div>
        </div>

        <div className="media-gallery-lightbox__header-right">
          <button
            type="button"
            className="media-gallery-lightbox__btn"
            onClick={() => onQuickEdit(currentDoc.id)}
            aria-label="Quick edit"
          >
            <EditIcon />
          </button>

          <button
            type="button"
            className={`media-gallery-lightbox__btn ${isPlaying ? 'media-gallery-lightbox__btn--active' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            type="button"
            className={`media-gallery-lightbox__btn ${showThumbnails ? 'media-gallery-lightbox__btn--active' : ''}`}
            onClick={() => setShowThumbnails(!showThumbnails)}
            aria-label="Toggle thumbnails"
          >
            <GridViewIcon />
          </button>

          <button
            type="button"
            className="media-gallery-lightbox__btn"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            <FullscreenIcon />
          </button>

          <div className="media-gallery-lightbox__separator" />

          <button
            type="button"
            className="media-gallery-lightbox__btn media-gallery-lightbox__btn--close"
            onClick={handleClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div
        className="media-gallery-lightbox__image-container"
        onTouchStart={(e) => {
          if (scale > 1) return // Disable swipe if zoomed
          const touch = e.changedTouches[0]
          // @ts-expect-error
          containerRef.current._touchStartX = touch.clientX
        }}
        onTouchEnd={(e) => {
          if (scale > 1) return // Disable swipe if zoomed
          const touch = e.changedTouches[0]
          // @ts-expect-error
          const startX = containerRef.current._touchStartX
          const endX = touch.clientX
          const diff = startX - endX

          if (Math.abs(diff) > 50) {
            // Threshold 50px
            if (diff > 0) handleNext()
            else handlePrev()
          }
        }}
      >
        {/* Side Navigation Buttons (Inside container for proper centering) */}
        <button
          type="button"
          className="media-gallery-lightbox__nav-btn media-gallery-lightbox__nav-btn--prev"
          onClick={handlePrev}
          aria-label="Previous image"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          className="media-gallery-lightbox__nav-btn media-gallery-lightbox__nav-btn--next"
          onClick={handleNext}
          aria-label="Next image"
        >
          <ChevronRightIcon />
        </button>
        {isLoading && (
          <div className="media-gallery-lightbox__spinner">
            <div className="media-gallery-lightbox__spinner-icon" />
          </div>
        )}
        {isVideo && (
          <video
            key={currentDoc.id}
            src={mediaUrl}
            controls
            autoPlay={isPlaying}
            className="media-gallery-lightbox__image"
            style={{ maxHeight: '100%', maxWidth: '100%', opacity: isLoading ? 0 : 1 }}
            onLoadedData={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          >
            <track kind="captions" />
          </video>
        )}
        {isImage && (
          /* biome-ignore lint: using standard img for external urls */
          <img
            key={currentDoc.id}
            src={mediaUrl}
            className="media-gallery-lightbox__image"
            alt={currentDoc.alt || currentDoc.filename}
            ref={(img) => {
              if (img?.complete) setIsLoading(false)
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            draggable={false}
            style={{
              opacity: isLoading ? 0 : 1,
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
              touchAction: 'none',
              padding: scale > 1 ? 0 : undefined,
            }}
            onClick={(e) => {
              // Prevent click processing if we dragged significantly
              if (dragStartRef.current.hasDragged) {
                // Reset flag
                dragStartRef.current.hasDragged = false
                return
              }

              // Single tap to toggle zoom
              if (scale > 1) {
                setScale(1)
                setPosition({ x: 0, y: 0 })
              } else {
                // Zoom to cursor (Focal Point)
                const viewportCenterX = window.innerWidth / 2
                const viewportCenterY = window.innerHeight / 2
                const mouseX = e.clientX - viewportCenterX
                const mouseY = e.clientY - viewportCenterY

                const newScale = 2.5

                let newX = mouseX * (1 - newScale)
                let newY = mouseY * (1 - newScale)

                // Apply strict bounds (approximated with current dims)
                const img = e.currentTarget as HTMLImageElement
                const cw = window.innerWidth
                const ch = window.innerHeight
                const iw = img.offsetWidth
                const ih = img.offsetHeight
                const scaledW = iw * newScale
                const scaledH = ih * newScale

                const BOUNDS_BUFFER = 80
                const xLimit = (scaledW <= cw ? 0 : (scaledW - cw) / 2) + BOUNDS_BUFFER
                const yLimit = (scaledH <= ch ? 0 : (scaledH - ch) / 2) + BOUNDS_BUFFER

                newX = Math.max(-xLimit, Math.min(xLimit, newX))
                newY = Math.max(-yLimit, Math.min(yLimit, newY))

                setScale(newScale)
                setPosition({ x: newX, y: newY })
              }
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
                // Pinch start
                const dist = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY,
                )
                // Calculate center of pinch for focal point
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
                // Pan start
                setIsDragging(true)
                dragStartRef.current = {
                  x: e.touches[0].clientX - position.x,
                  y: e.touches[0].clientY - position.y,
                  hasDragged: false,
                  startX: e.touches[0].clientX,
                  startY: e.touches[0].clientY,
                }
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2) {
                // Pinch move with focal point update
                e.preventDefault()
                const dist = Math.hypot(
                  e.touches[0].clientX - e.touches[1].clientX,
                  e.touches[0].clientY - e.touches[1].clientY,
                )

                // Current pinch center (in viewport coords)
                const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
                const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2

                // Relative to viewport center
                const viewportCenterX = window.innerWidth / 2
                const viewportCenterY = window.innerHeight / 2
                const currentPinchX = cx - viewportCenterX
                const currentPinchY = cy - viewportCenterY
                const startPinchX = pinchRef.current.startX - viewportCenterX
                const startPinchY = pinchRef.current.startY - viewportCenterY

                const ratio = dist / pinchRef.current.startDist
                const newScale = Math.min(Math.max(1, pinchRef.current.initialScale * ratio), 4)

                // Calculate new position to keep the pinch focal point stable
                // Formula: NewPos = CurrentPinchCenter - (StartPinchCenter - StartPos) * (NewScale / StartScale)

                let newX = 0
                let newY = 0

                if (newScale > 1) {
                  const scaleRatio = newScale / pinchRef.current.initialScale
                  // P_img = (StartPc - StartPos)
                  // NewPos = CurrentPc - P_img * ScaleRatio
                  const pImgX = startPinchX - pinchRef.current.startPos.x
                  const pImgY = startPinchY - pinchRef.current.startPos.y

                  newX = currentPinchX - pImgX * scaleRatio
                  newY = currentPinchY - pImgY * scaleRatio
                }

                if (newScale === 1) {
                  setPosition({ x: 0, y: 0 })
                } else {
                  if (containerRef.current) {
                    const img = e.currentTarget as HTMLImageElement
                    const container = containerRef.current
                    const cw = container.clientWidth
                    const ch = container.clientHeight
                    const iw = img.offsetWidth || cw
                    const ih = img.offsetHeight || ch

                    const scaledW = iw * newScale
                    const scaledH = ih * newScale

                    const BOUNDS_BUFFER = 80
                    const xLimit = (scaledW <= cw ? 0 : (scaledW - cw) / 2) + BOUNDS_BUFFER
                    const yLimit = (scaledH <= ch ? 0 : (scaledH - ch) / 2) + BOUNDS_BUFFER

                    newX = Math.max(-xLimit, Math.min(xLimit, newX))
                    newY = Math.max(-yLimit, Math.min(yLimit, newY))

                    setPosition({ x: newX, y: newY })
                  }
                }

                setScale(newScale)
              } else if (e.touches.length === 1 && isDragging && scale > 1) {
                e.preventDefault()
                const cx = e.touches[0].clientX
                const cy = e.touches[0].clientY

                // Check drag control
                if (!dragStartRef.current.hasDragged) {
                  const moveDist = Math.hypot(
                    cx - dragStartRef.current.startX,
                    cy - dragStartRef.current.startY,
                  )
                  if (moveDist > 5) dragStartRef.current.hasDragged = true
                }

                if (dragStartRef.current.hasDragged) {
                  // Update position
                  let newX = cx - dragStartRef.current.x
                  let newY = cy - dragStartRef.current.y

                  if (containerRef.current) {
                    const img = e.currentTarget as HTMLImageElement
                    const container = containerRef.current
                    const cw = container.clientWidth
                    const ch = container.clientHeight
                    const iw = img.offsetWidth
                    const ih = img.offsetHeight

                    const scaledW = iw * scale
                    const scaledH = ih * scale

                    const BOUNDS_BUFFER = 80
                    const xLimit = (scaledW <= cw ? 0 : (scaledW - cw) / 2) + BOUNDS_BUFFER
                    const yLimit = (scaledH <= ch ? 0 : (scaledH - ch) / 2) + BOUNDS_BUFFER

                    newX = Math.max(-xLimit, Math.min(xLimit, newX))
                    newY = Math.max(-yLimit, Math.min(yLimit, newY))
                  }

                  setPosition({ x: newX, y: newY })
                }
              }
            }}
            onTouchEnd={() => {
              setIsDragging(false)
            }}
            onWheel={(e) => {
              // Focal point zoom
              e.preventDefault()

              const delta = e.deltaY * -0.002
              const newScale = Math.min(Math.max(1, scale + delta), 4)

              if (newScale === 1) {
                setPosition({ x: 0, y: 0 })
              } else {
                if (containerRef.current) {
                  const img = e.currentTarget as HTMLImageElement
                  const container = containerRef.current
                  const rect = container.getBoundingClientRect()
                  const cw = container.clientWidth
                  const ch = container.clientHeight
                  const cx = cw / 2
                  const cy = ch / 2

                  // Mouse relative to viewport center
                  const mouseX = e.clientX - (rect.left + cx)
                  const mouseY = e.clientY - (rect.top + cy)

                  // "Virtual" cursor pos on image before zoom
                  const imgX = (mouseX - position.x) / scale
                  const imgY = (mouseY - position.y) / scale

                  // New pos to keep cursor on same img point
                  let newX = mouseX - imgX * newScale
                  let newY = mouseY - imgY * newScale

                  // Apply bounds
                  const iw = img.offsetWidth || cw
                  const ih = img.offsetHeight || ch
                  const scaledW = iw * newScale
                  const scaledH = ih * newScale

                  const BOUNDS_BUFFER = 80
                  const xLimit = (scaledW <= cw ? 0 : (scaledW - cw) / 2) + BOUNDS_BUFFER
                  const yLimit = (scaledH <= ch ? 0 : (scaledH - ch) / 2) + BOUNDS_BUFFER

                  newX = Math.max(-xLimit, Math.min(xLimit, newX))
                  newY = Math.max(-yLimit, Math.min(yLimit, newY))

                  setPosition({ x: newX, y: newY })
                }
              }

              setScale(newScale)
            }}
            onMouseDown={(e) => {
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
            }}
            onMouseMove={(e) => {
              if (isDragging && scale > 1) {
                e.preventDefault()

                // Track drag distance
                const moveDist = Math.hypot(
                  e.clientX - dragStartRef.current.startX,
                  e.clientY - dragStartRef.current.startY,
                )
                if (moveDist > 5) dragStartRef.current.hasDragged = true

                if (dragStartRef.current.hasDragged) {
                  let newX = e.clientX - dragStartRef.current.x
                  let newY = e.clientY - dragStartRef.current.y

                  // Use robust bounds like onTouchMove
                  if (containerRef.current) {
                    const img = e.currentTarget as HTMLImageElement
                    const container = containerRef.current
                    const cw = container.clientWidth
                    const ch = container.clientHeight
                    const iw = img.offsetWidth
                    const ih = img.offsetHeight

                    const scaledW = iw * scale
                    const scaledH = ih * scale

                    const BOUNDS_BUFFER = 80
                    const xLimit = (scaledW <= cw ? 0 : (scaledW - cw) / 2) + BOUNDS_BUFFER
                    const yLimit = (scaledH <= ch ? 0 : (scaledH - ch) / 2) + BOUNDS_BUFFER

                    newX = Math.max(-xLimit, Math.min(xLimit, newX))
                    newY = Math.max(-yLimit, Math.min(yLimit, newY))
                  }

                  setPosition({ x: newX, y: newY })
                }
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onDoubleClick={(e) => {
              if (scale > 1) {
                setScale(1)
                setPosition({ x: 0, y: 0 })
              } else {
                // Double click focal zoom
                const viewportCenterX = window.innerWidth / 2
                const viewportCenterY = window.innerHeight / 2
                const mouseX = e.clientX - viewportCenterX
                const mouseY = e.clientY - viewportCenterY

                const newScale = 2.5

                let newX = mouseX * (1 - newScale)
                let newY = mouseY * (1 - newScale)

                const img = e.currentTarget as HTMLImageElement
                const cw = window.innerWidth
                const ch = window.innerHeight
                const iw = img.offsetWidth
                const ih = img.offsetHeight
                const scaledW = iw * newScale
                const scaledH = ih * newScale

                const BOUNDS_BUFFER = 80
                const xLimit = (scaledW <= cw ? 0 : (scaledW - cw) / 2) + BOUNDS_BUFFER
                const yLimit = (scaledH <= ch ? 0 : (scaledH - ch) / 2) + BOUNDS_BUFFER

                newX = Math.max(-xLimit, Math.min(xLimit, newX))
                newY = Math.max(-yLimit, Math.min(yLimit, newY))

                setScale(newScale)
                setPosition({ x: newX, y: newY })
              }
            }}
          />
        )}
        {isAudio && (
          <div className="media-gallery-lightbox__audio-player">
            <div className="media-gallery-lightbox__audio-icon">
              <AudioIcon />
            </div>
            <audio src={mediaUrl} controls className="media-gallery-lightbox__audio-element">
              <track kind="captions" />
            </audio>
          </div>
        )}
        {isDocument && (
          <div className="media-gallery-lightbox__document-fallback">
            <div className="media-gallery-lightbox__document-icon">
              <FileIcon />
            </div>
            <div className="media-gallery-lightbox__document-details">
              <h3>{currentDoc.filename}</h3>
              <a href={mediaUrl} download className="media-gallery-lightbox__download-link">
                Download File
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="media-gallery-lightbox__footer-info">
        <span className="media-gallery-lightbox__filename">{currentDoc.filename}</span>
        {currentDoc.alt && (
          <span className="media-gallery-lightbox__description">{currentDoc.alt}</span>
        )}
      </div>

      <div className={`media-gallery-lightbox__thumbnails ${showThumbnails ? '' : 'hidden'}`}>
        <div className="media-gallery-lightbox__thumbnails-track">
          {/* biome-ignore lint/suspicious/noExplicitAny: generic doc */}
          {docs.map((doc: any, i: number) => (
            <LightboxThumbnail
              key={doc.id}
              doc={doc}
              isActive={i === currentIndex}
              onClick={() => {
                setIsLoading(true)
                setCurrentIndex(i)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const LightboxThumbnail = ({
  doc,
  isActive,
  onClick,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: generic doc
  doc: any
  isActive: boolean
  onClick: () => void
}) => {
  const mimeType = getMimeType(doc.filename, doc.mimeType)
  const isVideo = mimeType.startsWith('video/')
  const isAudio = mimeType.startsWith('audio/')
  const isImage = mimeType.startsWith('image/')
  const thumbUrl = doc.sizes?.thumbnail?.url
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isActive && buttonRef.current) {
      buttonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [isActive])

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`media-gallery-lightbox__thumbnail-btn ${isActive ? 'media-gallery-lightbox__thumbnail-btn--active' : ''}`}
      onClick={onClick}
    >
      {isVideo ? (
        <>
          <video
            src={doc.url}
            poster={thumbUrl}
            muted
            playsInline
            preload="metadata"
            className="media-gallery-lightbox__thumbnail-video"
          >
            <track kind="captions" />
          </video>
          <div className="media-gallery-lightbox__thumbnail-overlay">
            <PlayIcon />
          </div>
        </>
      ) : isAudio ? (
        <div className="media-gallery-lightbox__thumbnail-fallback">
          <AudioIcon />
        </div>
      ) : isImage ? (
        // biome-ignore lint: thumb
        <img src={thumbUrl || doc.url} alt={doc.filename} />
      ) : (
        <div className="media-gallery-lightbox__thumbnail-fallback">
          <FileIcon />
        </div>
      )}
    </button>
  )
}
