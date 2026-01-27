'use client'

import { ShimmerEffect } from '@payloadcms/ui'
import type React from 'react'

interface MediaGalleryCardProps {
  id: string | number
  title: string
  previewUrl?: string
  originalUrl?: string
  isSelected?: boolean
  selectedCount?: number
  mimeType?: string
  width?: number
  height?: number
  focalX?: number
  focalY?: number
  variant?: 'default' | 'overlay'
}

import { useRef, useState } from 'react'
import { FileIcon } from '../Icons'

export const MediaGalleryCard: React.FC<MediaGalleryCardProps> = ({
  title,
  previewUrl,
  originalUrl,
  isSelected,
  mimeType,
  width,
  height,
  focalX,
  focalY,
  variant = 'default',
}) => {
  const isVideo = mimeType?.startsWith('video/')
  const hasThumbnail = !!previewUrl
  const videoRef = useRef<HTMLVideoElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isLoading, setIsLoading] = useState(!!(hasThumbnail || isVideo))
  const [isError, setIsError] = useState(false)

  // Use originalUrl (file) for video source if available, otherwise previewUrl
  const videoSrc = originalUrl || previewUrl
  // Only use previewUrl as poster if it's different from the video source (i.e. it's an image)
  const posterUrl = previewUrl !== videoSrc ? previewUrl : undefined
  const shouldPreload = posterUrl ? 'none' : 'metadata'

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setIsError(true)
  }

  const handleMouseEnter = () => {
    if (videoRef.current) {
      hoverTimeoutRef.current = setTimeout(() => {
        const playPromise = videoRef.current?.play()
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Auto-play was prevented
          })
        }
      }, 500) // 500ms delay before playing
    }
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    // biome-ignore lint: native payload pattern uses div
    <div
      role="button"
      className={`draggable-with-click folder-file-card folder-file-card--file ${isSelected ? 'folder-file-card--selected' : ''} ${variant === 'overlay' ? 'folder-file-card--overlay' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      title={title}
    >
      <div className="folder-file-card__preview-area">
        {!isError && (hasThumbnail || isVideo) ? (
          <div
            className={`thumbnail thumbnail--size-medium ${isLoading ? 'thumbnail--is-loading' : ''}`}
          >
            {isLoading && <ShimmerEffect height="100%" className="folder-file-card__skeleton" />}
            {isVideo ? (
              <video
                ref={videoRef}
                src={videoSrc}
                poster={posterUrl}
                width={width}
                height={height}
                muted
                loop
                playsInline
                preload={shouldPreload}
                onLoadedData={handleLoad}
                onError={handleError}
                style={
                  focalX !== undefined && focalY !== undefined
                    ? { objectPosition: `${focalX}% ${focalY}%` }
                    : undefined
                }
              />
            ) : (
              // biome-ignore lint: using standard img for external thumbnails
              <img
                src={previewUrl || ''}
                alt={title}
                width={width}
                height={height}
                loading="lazy"
                onLoad={handleLoad}
                onError={handleError}
                style={
                  focalX !== undefined && focalY !== undefined
                    ? { objectPosition: `${focalX}% ${focalY}%` }
                    : undefined
                }
              />
            )}
          </div>
        ) : (
          <div className="icon icon--document">
            <FileIcon />
          </div>
        )}
      </div>
      <div className="folder-file-card__titlebar-area">
        <div className="folder-file-card__icon-wrap">
          <div className="icon icon--document">
            <FileIcon />
          </div>
        </div>
        <div className="folder-file-card__titlebar-labels">
          <p className="folder-file-card__name" title={title}>
            <span>{title}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
