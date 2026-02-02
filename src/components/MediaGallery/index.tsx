'use client'

import {
  DefaultListView,
  useConfig,
  useDocumentDrawer,
  useListDrawerContext,
  useListQuery,
  usePreferences,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ListViewIcon } from '../../icons'
import { getMimeType, isAudioMime, isImageMime, isVideoMime } from '../../utils/media'
import type { ViewType } from '../ui/Layouts/registry'
import { layoutRegistry } from '../ui/Layouts/registry'
import { Lightbox } from '../ui/Lightbox'
import type { LightboxItem } from '../ui/Lightbox/types'
import { Selection } from '../ui/Selection'
import { Toggle } from '../ui/Toggle'
import type { MediaItem } from '../ui/types'
import type { MediaGalleryProps, PayloadMediaDoc } from './types'

export const MediaGallery: React.FC<MediaGalleryProps> = (props) => {
  const router = useRouter()
  const { collectionConfig } = props
  // Detect selection handler from context or props
  const { onSelect: contextOnSelect } = useListDrawerContext()

  const resolvedSelectionHandler = useMemo(() => {
    const listProps = props.listProps || {}
    const drawerProps = props.drawerProps || {}

    const handler =
      props.handleSelection ||
      props.onSelect ||
      props.onRowClick ||
      listProps.handleSelection ||
      listProps.onSelect ||
      listProps.onRowClick ||
      drawerProps.handleSelection ||
      drawerProps.onSelect ||
      contextOnSelect

    if (!handler) return undefined

    // Wrap the handler to ensure it receives the format Payload expects if it's the context one
    return (item: MediaItem) => {
      if (typeof handler === 'function') {
        // Some handlers expect just ID, others expect the object
        // Payload's context onSelect expects { collectionSlug, doc, docID }
        if (handler === contextOnSelect) {
          ;(handler as (args: { collectionSlug: string; doc: unknown; docID: string }) => void)({
            collectionSlug: collectionConfig?.slug || 'media', // Use collectionConfig.slug here
            doc: item.originalData,
            docID: String(item.id),
          })
        } else {
          ;(handler as (id: string | number) => void)(item.id)
        }
      }
    }
  }, [props, contextOnSelect, collectionConfig?.slug])

  const slug = collectionConfig?.slug || 'media'
  const PREFERENCE_KEY = `payload-${slug}-view`

  const { getPreference, setPreference } = usePreferences()
  const { data: listData } = useListQuery()

  const galleryItems: MediaItem[] = useMemo(() => {
    if (!listData?.docs) return []
    return (listData.docs as unknown as PayloadMediaDoc[]).map((doc) => {
      const mimeType = getMimeType(doc.filename, doc.mimeType)
      let type: LightboxItem['type'] = 'document'

      if (isImageMime(mimeType)) type = 'image'
      else if (isVideoMime(mimeType)) type = 'video'
      else if (isAudioMime(mimeType)) type = 'audio'

      return {
        id: doc.id,
        title: doc.filename,
        src: doc.url,
        thumbnail: doc.sizes?.thumbnail?.url,
        alt: doc.alt || doc.filename,
        filename: doc.filename,
        type,
        mimeType,
        width: doc.width,
        height: doc.height,
        focalX: doc.focalX,
        focalY: doc.focalY,
        href: `/admin/collections/${slug}/${doc.id}`,
        sizes: doc.sizes,
        originalData: doc,
      }
    })
  }, [listData?.docs, slug])

  const { config } = useConfig()
  const collectionLabel = useMemo(() => {
    const coll = config.collections.find((c) => c.slug === slug)
    return (coll as { labels?: { singular?: string } })?.labels?.singular || coll?.slug || 'Media'
  }, [config.collections, slug])

  const [viewType, setViewType] = useState<ViewType>('justified')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const [editingID, setEditingID] = useState<string | number | null>(null)
  const [openTrigger, setOpenTrigger] = useState(0)
  const openingPendingRef = useRef(false)

  const [DocumentDrawer, , { isDrawerOpen, openDrawer, closeDrawer }] = useDocumentDrawer({
    collectionSlug: slug,
    id: String(editingID),
  })

  useEffect(() => {
    if (openingPendingRef.current && editingID && !isDrawerOpen) {
      openDrawer()
      openingPendingRef.current = false
    }
  }, [editingID, openTrigger, isDrawerOpen, openDrawer])

  const handleQuickEdit = useCallback((id: string | number) => {
    setEditingID(id)
    setOpenTrigger((t) => t + 1)
    openingPendingRef.current = true
  }, [])

  const onSave = useCallback(() => {
    router.refresh()
  }, [router])

  const onDelete = useCallback(() => {
    closeDrawer()
    router.refresh()
  }, [router, closeDrawer])

  useLayoutEffect(() => {
    const fetchPreference = async () => {
      const savedView = await getPreference<ViewType>(PREFERENCE_KEY)
      // Check if saved view exists in registry or is 'list'
      if (savedView && (layoutRegistry[savedView] || savedView === 'list')) {
        setViewType(savedView)
      } else {
        setViewType('justified') // Default
      }
      setIsInitialized(true)
    }

    fetchPreference()
  }, [getPreference, PREFERENCE_KEY])

  const toggleView = (newView: ViewType) => {
    setViewType(newView)
    setPreference<string>(PREFERENCE_KEY, newView)
  }

  if (!isInitialized) return null

  // Combine internal 'list' view with registry keys
  const availableViews = [...Object.keys(layoutRegistry), 'list'] as ViewType[]

  // ... existing imports

  const listProps = {
    ...props,
    beforeActions: [
      ...(props.beforeActions || []),
      <Selection key="selection-info" />,
      ...availableViews.map((viewOption) => {
        const isList = viewOption === 'list'
        const config = isList
          ? { icon: <ListViewIcon />, label: 'List' }
          : layoutRegistry[viewOption]

        if (!config) return null

        return (
          <Toggle
            key={`view-toggle-${viewOption}`}
            view={viewOption}
            activeView={viewType}
            onToggle={toggleView}
            icon={config.icon}
            tooltip={config.label}
          />
        )
      }),
    ],
  }

  // Resolve component from registry if not 'list'
  const ActiveLayout = viewType !== 'list' ? layoutRegistry[viewType]?.component : null

  const TableSlot = (viewType !== 'list' ? null : props.Table) as React.ReactNode

  return (
    <React.Fragment>
      <DocumentDrawer onSave={onSave} onDelete={onDelete} />
      <DefaultListView
        {...listProps}
        BeforeListTable={
          <React.Fragment>
            {props.BeforeListTable}
            {ActiveLayout && (
              <ActiveLayout
                items={galleryItems}
                onQuickEdit={handleQuickEdit}
                onLightbox={(index) => {
                  setLightboxIndex(index)
                  setLightboxOpen(true)
                }}
                handleSelection={resolvedSelectionHandler}
                variant={layoutRegistry[viewType]?.variant}
                collectionLabel={collectionLabel}
              />
            )}
          </React.Fragment>
        }
        Table={TableSlot}
      />
      {lightboxOpen &&
        galleryItems.length > 0 &&
        createPortal(
          <Lightbox
            items={galleryItems}
            initialIndex={lightboxIndex ?? 0}
            onClose={() => setLightboxOpen(false)}
            onEdit={(item) => handleQuickEdit(item.id)}
          />,
          document.body,
        )}
    </React.Fragment>
  )
}
