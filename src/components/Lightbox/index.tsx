'use client'

import { useZoomPan } from '@sitebytom/use-zoom-pan'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AudioIcon, ChevronLeftIcon, ChevronRightIcon, FileIcon } from '../../icons'
import {
  getMimeType,
  isAudioMime,
  isDocumentMime,
  isImageMime,
  isVideoMime,
} from '../../utils/media'
import { LightboxFooter } from './Footer'
import { LightboxHeader } from './Header'

// Media types are handled by src/utils/media.ts

export const Lightbox = ({
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
  const [isLoading, setIsLoading] = useState(() => {
    const initialDoc = docs[initialIndex]
    const initialMime = initialDoc ? getMimeType(initialDoc.filename, initialDoc.mimeType) : ''
    return isImageMime(initialMime)
  })
  const containerRef = useRef<HTMLDivElement>(null)

  // Media type detection (moved up to be available for hooks/event listeners)
  const currentDoc = docs[currentIndex]
  const mimeType = currentDoc ? getMimeType(currentDoc.filename, currentDoc.mimeType) : ''
  const isVideo = isVideoMime(mimeType)
  const isAudio = isAudioMime(mimeType)
  const isImage = isImageMime(mimeType)
  const isDocument = isDocumentMime(mimeType)
  const mediaUrl = currentDoc?.url

  const { scale, position, isDragging, reset, contentProps, containerProps } = useZoomPan({
    containerRef,
    enableZoom: isImage,
    onNext: () => handleNext(),
    onPrev: () => handlePrev(),
  })

  // Reset zoom state when index changes
  useEffect(() => {
    reset()
  }, [currentIndex, reset])

  // If image is already in cache, hide spinner immediately
  useEffect(() => {
    if (!isImage) return
    const img = containerRef.current?.querySelector(
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
    const nextIndex = currentIndex < docs.length - 1 ? currentIndex + 1 : 0
    const nextDoc = docs[nextIndex]
    const mime = getMimeType(nextDoc.filename, nextDoc.mimeType)
    if (isImageMime(mime)) setIsLoading(true)
    else setIsLoading(false)
    setCurrentIndex(nextIndex)
  }, [currentIndex, docs, docs.length])

  const handlePrev = useCallback(() => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : docs.length - 1
    const prevDoc = docs[prevIndex]
    const mime = getMimeType(prevDoc.filename, prevDoc.mimeType)
    if (isImageMime(mime)) setIsLoading(true)
    else setIsLoading(false)
    setCurrentIndex(prevIndex)
  }, [currentIndex, docs, docs.length])

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

  if (!currentDoc) return null

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
        totalDocs={docs.length}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        showThumbnails={showThumbnails}
        setShowThumbnails={setShowThumbnails}
        toggleFullscreen={toggleFullscreen}
        onClose={handleClose}
        onQuickEdit={() => onQuickEdit(currentDoc.id)}
      />

      <div className="media-gallery-lightbox__image-container" {...containerProps}>
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
            {...contentProps}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            draggable={false}
            style={{
              ...contentProps.style,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              opacity: isLoading ? 0 : 1,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
              padding: scale > 1 ? 0 : undefined,
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

      <LightboxFooter
        currentDoc={currentDoc}
        docs={docs}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        setIsLoading={setIsLoading}
        showThumbnails={showThumbnails}
      />
    </div>
  )
}
