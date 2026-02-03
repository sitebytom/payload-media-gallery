import { Button, CheckboxInput, ShimmerEffect } from '@payloadcms/ui'
import Link from 'next/link'
import type React from 'react'
import { memo, useEffect, useRef, useState } from 'react'
import { DragHandleIcon, EditIcon, ExpandIcon, FileIcon } from '../../../icons'
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
    handleSelection,
    useOriginal,
    footer = 'always',
    className,
    collectionLabel,
    lightboxEnabled = true,
    dragAttributes,
    dragListeners,
    isDragging,
  }: ItemProps & { footer?: 'always' | 'hover'; lightboxEnabled?: boolean }) => {
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

    const CardContent = (
      <div className="media-gallery-item__card-wrapper">
        <div
          className={`draggable-with-click media-card media-card--file ${isSelected ? 'media-card--selected' : ''} ${footer === 'hover' ? 'media-card--overlay' : ''} ${item.type === 'document' || item.type === 'audio' ? 'media-card--show-footer' : ''}`}
        >
          <div className="media-card__preview">
            {!isError && (hasThumbnail || isVideo) ? (
              <div
                className={`thumbnail ${!useOriginal && footer === 'always' ? 'thumbnail--size-medium' : ''} ${isLoading ? 'thumbnail--is-loading' : ''}`}
              >
                {isLoading && <ShimmerEffect height="100%" className="media-card__skeleton" />}
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
                    draggable={false}
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
          <div className="media-card__footer">
            <span className="media-card__filename" title={title}>
              {title}
            </span>
            <span className="media-card__label">
              {item.originalData?.folder?.name ||
                (item.type === 'image' && 'Image') ||
                (item.type === 'video' && 'Video') ||
                (item.type === 'audio' && 'Audio') ||
                (item.type === 'document' && 'Doc') ||
                collectionLabel ||
                'Doc'}
            </span>
          </div>
        </div>
      </div>
    )

    return (
      // biome-ignore lint/a11y/useSemanticElements: using div for grid layout
      <div
        role="gridcell"
        aria-selected={isSelected}
        aria-label={title}
        className={`media-gallery-grid__item-wrapper${selectedCount > 0 ? ' media-gallery-grid__item-wrapper--selection-mode' : ''} ${className || ''} ${isDragging ? 'media-gallery-grid__item-wrapper--dragging' : ''}`}
        tabIndex={-1}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {handleSelection ? (
          // biome-ignore lint/a11y/useSemanticElements: using div for grid layout
          <div
            role="button"
            className={`media-gallery-grid__item${focusedIndex === index ? ' media-gallery-grid__item--focused' : ''}`}
            draggable={false}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault()
              e.stopPropagation()
              if (e.metaKey || e.ctrlKey || e.shiftKey) {
                onOnClick(e, index)
                return
              }
              handleSelection(item)
            }}
            onMouseDown={(e: React.MouseEvent) => onOnMouseDown(e, item, index)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleSelection(item)
              }
            }}
            tabIndex={0}
            onFocus={() => {
              onFocus(index)
              handleMouseEnter()
            }}
            onBlur={handleMouseLeave}
          >
            {CardContent}
          </div>
        ) : (
          <Link
            ref={linkRef}
            href={href}
            prefetch={false}
            className={`media-gallery-grid__item${focusedIndex === index ? ' media-gallery-grid__item--focused' : ''}`}
            draggable={false}
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
            {CardContent}
          </Link>
        )}
        <div className="media-gallery-grid__checkbox">
          <CheckboxInput
            checked={isSelected}
            onToggle={() => {
              onSelectionChange(item.id)
            }}
          />
        </div>
        <div className="media-gallery-grid__controls" title="">
          {dragListeners && (
            <div
              className="media-gallery-grid__action-btn media-gallery-grid__drag-handle"
              {...dragListeners}
              {...dragAttributes}
            >
              <DragHandleIcon />
            </div>
          )}
          {onQuickEdit && (
            <Button
              buttonStyle="icon-label"
              className="media-gallery-grid__edit-btn"
              icon={<EditIcon />}
              margin={false}
              onClick={(e) => {
                onQuickEdit(e, item.id)
              }}
              round
              tooltip="Quick Edit"
            />
          )}
          {onLightbox && lightboxEnabled && (
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
          )}
        </div>
      </div>
    )
  },
)
