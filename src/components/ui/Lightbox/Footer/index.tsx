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
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const dragStartTime = useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    isDragging.current = true
    startX.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
    dragStartTime.current = Date.now()
    scrollRef.current.style.cursor = 'grabbing'
    scrollRef.current.style.userSelect = 'none'
  }

  const handleMouseUp = () => {
    isDragging.current = false
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab'
      scrollRef.current.style.removeProperty('user-select')
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5 // Multiplier for faster scroll
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }

  return (
    <>
      <div className="media-gallery-lightbox__footer-info">
        <span className="media-gallery-lightbox__filename">{currentItem.filename}</span>
        {currentItem.alt && (
          <span className="media-gallery-lightbox__description">{currentItem.alt}</span>
        )}
      </div>

      <section
        ref={scrollRef}
        className={`media-gallery-lightbox__thumbnails ${showThumbnails ? '' : 'hidden'}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ cursor: 'grab' }}
        aria-label="Thumbnail navigation"
      >
        <div className="media-gallery-lightbox__thumbnails-track">
          {items.map((item, i) => (
            <LightboxThumbnail
              key={item.id}
              item={item}
              isActive={i === currentIndex}
              onClick={() => {
                // Ignore click if it's a long drag
                if (Date.now() - dragStartTime.current > 200) return

                if (item.type === 'image') setIsLoading(true)
                else setIsLoading(false)
                setCurrentIndex(i)
              }}
            />
          ))}
        </div>
      </section>
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
        <img src={thumbUrl} alt={item.filename} draggable={false} />
      ) : (
        <div className="media-gallery-lightbox__thumbnail-fallback">
          <FileIcon />
        </div>
      )}
    </button>
  )
}
