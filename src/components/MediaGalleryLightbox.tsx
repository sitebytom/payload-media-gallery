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
  const containerRef = useRef<HTMLDivElement>(null)

  // Focus management on mount
  useEffect(() => {
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

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < docs.length - 1 ? prev + 1 : 0)) // Wrap around for slideshow
  }, [docs.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : docs.length - 1)) // Wrap around
  }, [docs.length])

  // Slideshow logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(handleNext, 3000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, handleNext])

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
          onClose()
          break
        case ' ': // Space to toggle play/pause
          setIsPlaying((p) => !p)
          break
      }
    },
    [handleNext, handlePrev, onClose],
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
      className="media-gallery-lightbox"
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
        onClick={onClose}
        aria-label="Close lightbox"
      />

      {/* Header Area (Absolute Top) */}
      <div className="media-gallery-lightbox__header">
        <div className="media-gallery-lightbox__header-left">
          <div className="media-gallery-lightbox__counter">
            {currentIndex + 1} / {docs.length}
          </div>
          <div className="media-gallery-lightbox__info">
            <span className="media-gallery-lightbox__filename">{currentDoc.filename}</span>
            {currentDoc.alt && (
              <span className="media-gallery-lightbox__description">{currentDoc.alt}</span>
            )}
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
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="media-gallery-lightbox__image-container">
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
        {isVideo && (
          <video
            src={mediaUrl}
            controls
            autoPlay={isPlaying}
            className="media-gallery-lightbox__image"
            style={{ maxHeight: '100%', maxWidth: '100%' }}
          >
            <track kind="captions" />
          </video>
        )}

        {isImage && (
          /* biome-ignore lint: using standard img for external urls */
          <img
            src={mediaUrl}
            className="media-gallery-lightbox__image"
            alt={currentDoc.alt || currentDoc.filename}
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

      <div className={`media-gallery-lightbox__thumbnails ${showThumbnails ? '' : 'hidden'}`}>
        <div className="media-gallery-lightbox__thumbnails-track">
          {/* biome-ignore lint/suspicious/noExplicitAny: generic doc */}
          {docs.map((doc: any, i: number) => (
            <LightboxThumbnail
              key={doc.id}
              doc={doc}
              isActive={i === currentIndex}
              onClick={() => setCurrentIndex(i)}
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
