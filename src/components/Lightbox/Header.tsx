'use client'

import type React from 'react'
import { CloseIcon, EditIcon, FullscreenIcon, GridViewIcon, PauseIcon, PlayIcon } from '../../icons'

interface LightboxHeaderProps {
  currentIndex: number
  totalDocs: number
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  showThumbnails: boolean
  setShowThumbnails: (show: boolean) => void
  toggleFullscreen: () => void
  onClose: () => void
  onQuickEdit: () => void
}

export const LightboxHeader: React.FC<LightboxHeaderProps> = ({
  currentIndex,
  totalDocs,
  isPlaying,
  setIsPlaying,
  showThumbnails,
  setShowThumbnails,
  toggleFullscreen,
  onClose,
  onQuickEdit,
}) => {
  return (
    <div className="media-gallery-lightbox__header">
      <div className="media-gallery-lightbox__header-left">
        <div className="media-gallery-lightbox__counter">
          {currentIndex + 1} / {totalDocs}
        </div>
      </div>

      <div className="media-gallery-lightbox__header-right">
        <button
          type="button"
          className="media-gallery-lightbox__btn"
          onClick={onQuickEdit}
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
  )
}
