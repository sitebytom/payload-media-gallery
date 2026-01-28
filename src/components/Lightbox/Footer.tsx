'use client'

import type React from 'react'
import { useEffect, useRef } from 'react'
import { AudioIcon, FileIcon, PlayIcon } from '../../icons'
import { getMimeType, isAudioMime, isImageMime, isVideoMime } from '../../utils/media'

interface LightboxFooterProps {
  // biome-ignore lint/suspicious/noExplicitAny: generic doc
  currentDoc: any
  // biome-ignore lint/suspicious/noExplicitAny: generic docs
  docs: any[]
  currentIndex: number
  setCurrentIndex: (index: number) => void
  setIsLoading: (loading: boolean) => void
  showThumbnails: boolean
}

export const LightboxFooter: React.FC<LightboxFooterProps> = ({
  currentDoc,
  docs,
  currentIndex,
  setCurrentIndex,
  setIsLoading,
  showThumbnails,
}) => {
  return (
    <>
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
                const mime = getMimeType(doc.filename, doc.mimeType)
                if (isImageMime(mime)) setIsLoading(true)
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
  const isVideo = isVideoMime(mimeType)
  const isAudio = isAudioMime(mimeType)
  const isImage = isImageMime(mimeType)
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
