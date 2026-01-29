'use client'

import { Button, CheckboxInput } from '@payloadcms/ui'
import Link from 'next/link'
import { memo, useEffect, useRef } from 'react'
import { EditIcon, ExpandIcon } from '../Icons'
import { MediaGalleryCard } from './MediaGalleryCard'

export const MediaGalleryItem = memo(
  ({
    doc,
    index,
    slug,
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
    variant,
  }: {
    // biome-ignore lint/suspicious/noExplicitAny: doc type is dynamic
    doc: any
    index: number
    slug: string
    focusedIndex: number | null
    isSelected: boolean
    selectedCount: number
    onOnClick: (event: React.MouseEvent, index: number) => void
    // biome-ignore lint/suspicious/noExplicitAny: doc type is dynamic
    onOnMouseDown: (event: React.MouseEvent, doc: any, index: number) => void
    onQuickEdit: (e: React.MouseEvent, id: string | number) => void
    onLightbox: (index: number) => void
    onSelectionChange: (id: string | number) => void
    onFocus: (index: number) => void
    useOriginal?: boolean
    variant?: 'default' | 'overlay'
  }) => {
    const linkRef = useRef<HTMLAnchorElement>(null)

    useEffect(() => {
      if (focusedIndex === index && linkRef.current) {
        linkRef.current.focus()
      }
    }, [focusedIndex, index])

    return (
      // biome-ignore lint/a11y/useSemanticElements: using div for grid layout
      <div
        role="gridcell"
        aria-selected={isSelected}
        aria-label={doc.filename}
        className={`media-grid__item-wrapper${selectedCount > 0 ? ' media-grid__item-wrapper--selection-mode' : ''}`}
        tabIndex={-1}
      >
        <Link
          ref={linkRef}
          href={`/admin/collections/${slug}/${doc.id}`}
          prefetch={false}
          className={`media-grid__item${focusedIndex === index ? ' media-grid__item--focused' : ''}`}
          onFocus={() => onFocus(index)}
          onClick={(e: React.MouseEvent) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey) {
              onOnClick(e, index)
              return
            }

            if (selectedCount > 0) {
              e.preventDefault()
              e.stopPropagation()
              // Use hook directly for verifyable toggle, or fallback to prop if needed
              // But onSelectionChange passed from Grid handles multi-select logic so we keep it.
              onSelectionChange(doc.id)
            }
            onOnClick(e, index)
          }}
          onMouseDown={(e: React.MouseEvent) => onOnMouseDown(e, doc, index)}
          onContextMenu={(e: React.MouseEvent) =>
            (e.ctrlKey || e.metaKey || e.shiftKey) && e.preventDefault()
          }
        >
          <MediaGalleryCard
            id={doc.id}
            title={doc.filename}
            previewUrl={useOriginal ? doc.url : doc.sizes?.thumbnail?.url || doc.url || undefined}
            originalUrl={doc.url}
            isSelected={isSelected}
            selectedCount={selectedCount}
            mimeType={doc.mimeType}
            width={useOriginal ? doc.width : doc.sizes?.thumbnail?.width || doc.width}
            height={useOriginal ? doc.height : doc.sizes?.thumbnail?.height || doc.height}
            focalX={doc.focalX}
            focalY={doc.focalY}
            variant={variant}
          />
        </Link>
        <div className="media-grid__select-checkbox">
          <CheckboxInput
            checked={isSelected}
            onToggle={() => {
              onSelectionChange(doc.id)
            }}
          />
        </div>
        <Button
          buttonStyle="icon-label"
          className="media-grid__expand-button"
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
          className="media-grid__edit-button"
          icon={<EditIcon />}
          margin={false}
          onClick={(e) => onQuickEdit(e, doc.id)}
          round
          tooltip="Quick Edit"
        />
      </div>
    )
  },
)
