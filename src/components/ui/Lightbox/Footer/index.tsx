'use client'

import type React from 'react'
import { useEffect, useRef } from 'react'
import { AudioIcon, FileIcon, PlayIcon } from '../../../../icons'
// import { getMimeType, isAudioMime, isImageMime, isVideoMime } from '../../../utils/media' // Removed
import type { LightboxItem } from '../types'
import type { LightboxFooterProps } from './types'
import './index.scss'

export const LightboxFooter: React.FC<LightboxFooterProps> = ({
  currentItem,
  items,
  currentIndex,
  setCurrentIndex,
  setIsLoading,
  showThumbnails,
}) => {
  return (
    <>
      <div className="media-gallery-lightbox__footer-info">
        <span className="media-gallery-lightbox__filename">{currentItem.filename}</span>
        {currentItem.alt && (
          <span className="media-gallery-lightbox__description">{currentItem.alt}</span>
        )}
      </div>

      <div className={`media-gallery-lightbox__thumbnails ${showThumbnails ? '' : 'hidden'}`}>
        <div className="media-gallery-lightbox__thumbnails-track">
          {items.map((item, i) => (
            <LightboxThumbnail
              key={item.id}
              item={item}
              isActive={i === currentIndex}
              onClick={() => {
                if (item.type === 'image') setIsLoading(true)
                else setIsLoading(false)
                setCurrentIndex(i)
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

const LightboxThumbnail = ({
  item,
  isActive,
  onClick,
}: {
  item: LightboxItem
  isActive: boolean
  onClick: () => void
}) => {
  const isVideo = item.type === 'video'
  const isAudio = item.type === 'audio'
  const isImage = item.type === 'image'
  const thumbUrl = item.thumbnail || item.src
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
            src={item.src}
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
        <img src={thumbUrl} alt={item.filename} />
      ) : (
        <div className="media-gallery-lightbox__thumbnail-fallback">
          <FileIcon />
        </div>
      )}
    </button>
  )
}
