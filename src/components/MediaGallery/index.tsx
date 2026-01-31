'use client'

import { DefaultListView, useDocumentDrawer, useListQuery, usePreferences } from '@payloadcms/ui'
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

// biome-ignore lint/suspicious/noExplicitAny: generic component props
export const MediaGallery: React.FC<any> = (props) => {
  const router = useRouter()
  // biome-ignore lint/suspicious/noExplicitAny: props are dynamic
  const { collectionConfig } = props as any
  const slug = collectionConfig?.slug || 'media'
  const PREFERENCE_KEY = `payload-${slug}-view`

  const { getPreference, setPreference } = usePreferences()
  const { data: listData } = useListQuery()

  const galleryItems: MediaItem[] = useMemo(() => {
    if (!listData?.docs) return []
    // biome-ignore lint/suspicious/noExplicitAny: generic doc
    return listData.docs.map((doc: any) => {
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

  const hideTable = () => null

  // Resolve component from registry if not 'list'
  const ActiveLayout = viewType !== 'list' ? layoutRegistry[viewType]?.component : null

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
              />
            )}
          </React.Fragment>
        }
        Table={viewType !== 'list' ? hideTable : props.Table}
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
