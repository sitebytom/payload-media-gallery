'use client'

import { Button, CheckboxInput } from '@payloadcms/ui'
import Link from 'next/link'
import type React from 'react'
import { memo, useEffect, useRef } from 'react'
import { EditIcon, ExpandIcon } from '../../icons'
import { Card } from './Card'

export const Item = memo(
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
        className={`media-gallery-grid__item-wrapper${selectedCount > 0 ? ' media-gallery-grid__item-wrapper--selection-mode' : ''}`}
        tabIndex={-1}
      >
        <Link
          ref={linkRef}
          href={`/admin/collections/${slug}/${doc.id}`}
          prefetch={false}
          className={`media-gallery-grid__item${focusedIndex === index ? ' media-gallery-grid__item--focused' : ''}`}
          onFocus={() => onFocus(index)}
          onClick={(e: React.MouseEvent) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey) {
              onOnClick(e, index)
              return
            }

            if (selectedCount > 0) {
              e.preventDefault()
              e.stopPropagation()
              onSelectionChange(doc.id)
            }
            onOnClick(e, index)
          }}
          onMouseDown={(e: React.MouseEvent) => onOnMouseDown(e, doc, index)}
          onContextMenu={(e: React.MouseEvent) =>
            (e.ctrlKey || e.metaKey || e.shiftKey) && e.preventDefault()
          }
        >
          <div className="media-gallery-item__card-wrapper">
            <Card
              id={doc.id}
              title={doc.filename}
              previewUrl={useOriginal ? doc.url : doc.sizes?.card?.url || doc.url}
              originalUrl={doc.url}
              mimeType={doc.mimeType}
              isSelected={isSelected}
              selectedCount={selectedCount}
              width={useOriginal ? doc.width : doc.sizes?.thumbnail?.width || doc.width}
              height={useOriginal ? doc.height : doc.sizes?.thumbnail?.height || doc.height}
              focalX={doc.focalX}
              focalY={doc.focalY}
              variant={variant}
            />
          </div>
        </Link>
        <div className="media-gallery-grid__checkbox">
          <CheckboxInput
            checked={isSelected}
            onToggle={() => {
              onSelectionChange(doc.id)
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
          onClick={(e) => onQuickEdit(e, doc.id)}
          round
          tooltip="Quick Edit"
        />
      </div>
    )
  },
)
