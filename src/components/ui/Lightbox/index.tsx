'use client'

import { useZoomPan } from '@sitebytom/use-zoom-pan'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AudioIcon, ChevronLeftIcon, ChevronRightIcon, FileIcon } from '../../../icons'
import { LightboxFooter } from './Footer'
import { LightboxHeader } from './Header'
import type { LightboxItem, LightboxProps } from './types'
import './index.scss'

export const Lightbox = ({ items, initialIndex, onClose, onEdit }: LightboxProps) => {
  const constructSrcSet = useCallback((item: LightboxItem) => {
    if (!item || item.type !== 'image' || !item.sizes) return undefined

    // Filter sizes by aspect ratio to avoid showing cropped versions (like cards/thumbnails)
    // only if original dimensions are available
    const targetRatio = item.width && item.height ? item.width / item.height : undefined
    const tolerance = 0.05

    const entries = Object.values(item.sizes)
      .filter((size) => {
        if (!size || !size.url || !size.width) return false
        // If we have target ratio, filter by it
        if (targetRatio && size.height) {
          const ratio = size.width / size.height
          return Math.abs(ratio - targetRatio) < tolerance
        }
        return true
      })
      .map((size) => `${size!.url} ${size!.width}w`)

    // Add original if it has dimensions, otherwise we can't really use it in srcset reliably without width
    // But usually sizes are enough.
    if (item.width && item.src) {
      entries.push(`${item.src} ${item.width}w`)
    }

    if (entries.length === 0) return undefined
    return entries.join(', ')
  }, [])

  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const currentItem = items[currentIndex]

  const [isPlaying, setIsPlaying] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Track if we have loaded the high-res version for the CURRENT item
  const [isHighResLoaded, setIsHighResLoaded] = useState(false)

  const [isLoading, setIsLoading] = useState(() => {
    const initialItem = items[initialIndex]
    return initialItem?.type === 'image'
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomPanRef = useRef<HTMLDivElement>(null)

  const isVideo = currentItem?.type === 'video'
  const isAudio = currentItem?.type === 'audio'
  const isImage = currentItem?.type === 'image'
  const isDocument = currentItem?.type === 'document'

  const srcSet = useMemo(
    () => (isImage && !isHighResLoaded ? constructSrcSet(currentItem) : undefined),
    [isImage, isHighResLoaded, currentItem, constructSrcSet],
  )

  // Use a fallback for the src attribute (so it's not empty, but let srcset do the work)
  // Prefer a medium/large image if available to avoid loading full res as fallback immediately
  const fallbackSrc = useMemo(() => {
    if (!isImage || !currentItem?.sizes) return currentItem?.src

    const targetRatio =
      currentItem.width && currentItem.height ? currentItem.width / currentItem.height : undefined
    const tolerance = 0.05

    // Helper to check if size matches aspect ratio
    const isGoodSize = (size: { url?: string; width?: number; height?: number } | undefined) => {
      if (!size?.url || !size.width || !size.height || !targetRatio) return false
      const ratio = size.width / size.height
      return Math.abs(ratio - targetRatio) < tolerance
    }

    // Try to find a 'large' or 'medium' that matches aspect ratio
    const large = isGoodSize(currentItem.sizes.xlarge)
      ? currentItem.sizes.xlarge
      : isGoodSize(currentItem.sizes.large)
        ? currentItem.sizes.large
        : undefined
    const medium = isGoodSize(currentItem.sizes.medium) ? currentItem.sizes.medium : undefined

    const size = large || medium
    return size?.url || currentItem.src
  }, [currentItem, isImage])

  // Use original as src (fallback) or enforced src when high-res is loaded
  const mediaUrl = isImage && !isHighResLoaded && fallbackSrc ? fallbackSrc : currentItem?.src

  const { contentProps, containerProps, reset, isDragging, scale } = useZoomPan({
    containerRef: zoomPanRef,
    enableZoom: isImage,
    onNext: () => handleNext(),
    onPrev: () => handlePrev(),
    options: { boundsBuffer: 0 },
  })

  // Track if we are currently loading the high-res version to prevent duplicate requests during zoom
  const isLoadingHighRes = useRef(false)

  // Reset zoom state when index changes
  useEffect(() => {
    reset()
    setIsHighResLoaded(false) // Reset high-res status
    isLoadingHighRes.current = false
  }, [currentIndex, reset])

  // Progressive Loading: Load high-res in background ONLY when zoomed in
  useEffect(() => {
    // Only load if zoomed in beyond 30%
    if (scale <= 1.3) return

    if (!isImage || !currentItem?.src || isHighResLoaded || isLoadingHighRes.current) return

    isLoadingHighRes.current = true

    // Load original when user zooms in
    const img = new Image()
    img.src = currentItem.src

    // Use decode() to ensure image is ready to be painted without stutter
    img
      .decode()
      .then(() => {
        // Only update if we are still looking at the same item (ref check helpful but component might have unmounted/changed)
        // We can check if the currentItem.src matches or rely on cleanup/effect dependencies,
        // but simple check is: are we still "loading" for this item?
        if (isLoadingHighRes.current) {
          setIsHighResLoaded(true)
        }
      })
      .catch((err) => {
        // If decode fails (e.g. not supported or error), fall back to onload or just ignore
        console.error('Error decoding high-res image', err)
        isLoadingHighRes.current = false
      })
  }, [isImage, currentItem, isHighResLoaded, scale])

  // If image is already in cache, hide spinner immediately
  useEffect(() => {
    if (!isImage) return
    const img = zoomPanRef.current?.querySelector(
      '.media-gallery-lightbox__image',
    ) as HTMLImageElement
    if (img?.complete) setIsLoading(false)
  }, [currentIndex, isImage])

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
    const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
    const nextItem = items[nextIndex]
    if (nextItem.type === 'image') setIsLoading(true)
    else setIsLoading(false)
    setCurrentIndex(nextIndex)
  }, [currentIndex, items])

  const handlePrev = useCallback(() => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
    const prevItem = items[prevIndex]
    if (prevItem.type === 'image') setIsLoading(true)
    else setIsLoading(false)
    setCurrentIndex(prevIndex)
  }, [currentIndex, items])

  // Preload next/prev images (Low res preferred)
  useEffect(() => {
    const preloadImage = (index: number) => {
      const item = items[index]
      if (!item) return
      if (item.type === 'image') {
        const img = new Image()
        // With srcset, preloading is tricky. Let's just preload the src
        // or we could reimplement constructSrcSet here but parsing it is hard.
        // Simple preload for now:
        img.src = item.src
      }
    }

    const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1

    preloadImage(nextIndex)
    preloadImage(prevIndex)
  }, [currentIndex, items])

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
    [handleNext, handlePrev, handleClose],
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

  if (!currentItem) return null

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

      <LightboxHeader
        currentIndex={currentIndex}
        totalItems={items.length}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        showThumbnails={showThumbnails}
        setShowThumbnails={setShowThumbnails}
        toggleFullscreen={toggleFullscreen}
        onClose={handleClose}
        onEdit={onEdit ? () => onEdit(currentItem) : undefined}
      />

      <div className="media-gallery-lightbox__image-container" ref={zoomPanRef} {...containerProps}>
        {/* Side Navigation Buttons (Inside container for proper centering) */}
        <button
          type="button"
          className="media-gallery-lightbox__nav-btn media-gallery-lightbox__nav-btn--prev"
          onClick={handlePrev}
          aria-label="Previous item"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          className="media-gallery-lightbox__nav-btn media-gallery-lightbox__nav-btn--next"
          onClick={handleNext}
          aria-label="Next item"
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
            key={currentItem.id}
            src={mediaUrl}
            controls
            autoPlay={isPlaying}
            className="media-gallery-lightbox__image"
            style={{ opacity: isLoading ? 0 : 1 }}
            onLoadedData={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          >
            <track kind="captions" />
          </video>
        )}
        {isImage && (
          <div
            className="media-gallery-lightbox__image-wrapper"
            {...contentProps}
            style={{
              ...contentProps.style,
              aspectRatio:
                currentItem.width && currentItem.height
                  ? `${currentItem.width} / ${currentItem.height}`
                  : undefined,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
              cursor: scale > 1 ? 'grab' : 'zoom-in',
            }}
          >
            {/* biome-ignore lint/performance/noImgElement: using standard img for external urls */}
            <img
              key={currentItem.id}
              src={mediaUrl}
              srcSet={srcSet}
              sizes="100vw"
              width={currentItem.width}
              height={currentItem.height}
              className="media-gallery-lightbox__image"
              alt={currentItem.alt || currentItem.filename}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              draggable={false}
              style={{
                opacity: isLoading ? 0 : 1,
              }}
            />
          </div>
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
              <h3>{currentItem.filename}</h3>
              <a href={mediaUrl} download className="media-gallery-lightbox__download-link">
                Download File
              </a>
            </div>
          </div>
        )}
      </div>

      <LightboxFooter
        currentItem={currentItem}
        items={items}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        setIsLoading={setIsLoading}
        showThumbnails={showThumbnails}
      />
    </div>
  )
}
