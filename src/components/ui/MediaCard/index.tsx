import { Button, CheckboxInput, ShimmerEffect } from '@payloadcms/ui'
import Link from 'next/link'
import type React from 'react'
import { memo, useEffect, useRef, useState } from 'react'
import { EditIcon, ExpandIcon, FileIcon } from '../../../icons'
import { isVideoMime } from '../../../utils/media'
import type { ItemProps } from './types'
import './index.scss'

export const MediaCard = memo(
  ({
    item,
    index,
    focusedIndex,
    isSelected,
    selectedCount,
    onOnClick,
    onOnMouseDown,
    onQuickEdit,
    onLightbox,
    onSelectionChange,
    onFocus,
    useOriginal,
    variant = 'default',
    className,
  }: ItemProps) => {
    const linkRef = useRef<HTMLAnchorElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const title = item.title || item.filename || 'Untitled'
    // Derived props that were passed to Card
    const previewUrl = useOriginal
      ? item.src
      : item.thumbnail || item.sizes?.thumbnail?.url || item.src
    const originalUrl = item.src
    const mimeType = item.mimeType
    const width = useOriginal ? item.width : item.sizes?.thumbnail?.width || item.width
    const height = useOriginal ? item.height : item.sizes?.thumbnail?.height || item.height
    const focalX = item.focalX
    const focalY = item.focalY

    const isVideo = isVideoMime(mimeType)
    const hasThumbnail = !!previewUrl
    const [isLoading, setIsLoading] = useState(!!(hasThumbnail || isVideo))
    const [isError, setIsError] = useState(false)

    // Video handling logic
    const videoSrc = originalUrl || previewUrl
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
        }, 500)
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

    useEffect(() => {
      if (focusedIndex === index && linkRef.current) {
        linkRef.current.focus()
      }
    }, [focusedIndex, index])

    const href = item.href || '#'

    return (
      // biome-ignore lint/a11y/useSemanticElements: using div for grid layout
      <div
        role="gridcell"
        aria-selected={isSelected}
        aria-label={title}
        className={`media-gallery-grid__item-wrapper${selectedCount > 0 ? ' media-gallery-grid__item-wrapper--selection-mode' : ''} ${className || ''}`}
        tabIndex={-1}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          ref={linkRef}
          href={href}
          prefetch={false}
          className={`media-gallery-grid__item${focusedIndex === index ? ' media-gallery-grid__item--focused' : ''}`}
          onFocus={() => {
            onFocus(index)
            handleMouseEnter()
          }}
          onBlur={handleMouseLeave}
          onClick={(e: React.MouseEvent) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey) {
              onOnClick(e, index)
              return
            }

            if (selectedCount > 0) {
              e.preventDefault()
              e.stopPropagation()
              onSelectionChange(item.id)
            }
            onOnClick(e, index)
          }}
          onMouseDown={(e: React.MouseEvent) => onOnMouseDown(e, item, index)}
          onContextMenu={(e: React.MouseEvent) =>
            (e.ctrlKey || e.metaKey || e.shiftKey) && e.preventDefault()
          }
        >
          <div className="media-gallery-item__card-wrapper">
            {/* Flattened Card Structure */}
            {/* biome-ignore lint: native payload pattern uses div */}
            <div
              role="button"
              className={`draggable-with-click folder-file-card folder-file-card--file ${isSelected ? 'folder-file-card--selected' : ''} ${variant === 'overlay' ? 'folder-file-card--overlay' : ''}`}
              title={title}
            >
              <div className="folder-file-card__preview-area">
                {!isError && (hasThumbnail || isVideo) ? (
                  <div
                    className={`thumbnail ${!useOriginal && variant !== 'overlay' ? 'thumbnail--size-medium' : ''} ${isLoading ? 'thumbnail--is-loading' : ''}`}
                  >
                    {isLoading && (
                      <ShimmerEffect height="100%" className="folder-file-card__skeleton" />
                    )}
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
          </div>
        </Link>
        <div className="media-gallery-grid__checkbox">
          <CheckboxInput
            checked={isSelected}
            onToggle={() => {
              onSelectionChange(item.id)
            }}
          />
        </div>
        <Button
          buttonStyle="icon-label"
          className="media-gallery-grid__expand-btn"
          icon={<ExpandIcon />}
          margin={false}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onLightbox(index)
          }}
          round
          tooltip="Expand"
        />
        <Button
          buttonStyle="icon-label"
          className="media-gallery-grid__edit-btn"
          icon={<EditIcon />}
          margin={false}
          onClick={(e) => onQuickEdit(e, item.id)}
          round
          tooltip="Quick Edit"
        />
      </div>
    )
  },
)
