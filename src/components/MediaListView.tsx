'use client'

import { DefaultListView, useDocumentDrawer, useListQuery, usePreferences } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MediaGalleryGrid } from './MediaGalleryGrid'
import { MediaGalleryJustified } from './MediaGalleryJustified'
import { MediaGalleryLightbox } from './MediaGalleryLightbox'
import { ViewToggleButton } from './ViewToggleButton'
import '../index.scss'

export type ViewType = 'list' | 'grid' | 'justified'

// biome-ignore lint/suspicious/noExplicitAny: generic component props
export const MediaListView: React.FC<any> = (props) => {
  const router = useRouter()
  // biome-ignore lint/suspicious/noExplicitAny: props are dynamic
  const { collectionConfig } = props as any
  const slug = collectionConfig?.slug || 'media'
  const PREFERENCE_KEY = `payload-${slug}-view`

  const { getPreference, setPreference } = usePreferences()
  const { data } = useListQuery()

  const [view, setView] = useState<ViewType>('justified')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
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

  const onQuickEdit = useCallback((id: string | number) => {
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
      if (savedView && ['list', 'grid', 'justified'].includes(savedView)) {
        setView(savedView)
      } else {
        setView('justified') // Default
      }
      setIsInitialized(true)
    }

    fetchPreference()
  }, [getPreference, PREFERENCE_KEY])

  const toggleView = (newView: ViewType) => {
    setView(newView)
    setPreference<string>(PREFERENCE_KEY, newView)
  }

  if (!isInitialized) return null
  const viewOptions: ViewType[] = ['justified', 'grid', 'list']

  const listProps = {
    ...props,
    beforeActions: [
      ...(props.beforeActions || []),
      ...viewOptions.map((viewType) => (
        <ViewToggleButton
          key={`view-toggle-${viewType}`}
          view={viewType}
          activeView={view}
          onToggle={toggleView}
        />
      )),
    ],
  }

  const hideTable = () => null

  return (
    <React.Fragment>
      <DocumentDrawer onSave={onSave} onDelete={onDelete} />
      <DefaultListView
        {...listProps}
        BeforeListTable={
          <React.Fragment>
            {props.BeforeListTable}
            {view === 'grid' && (
              <MediaGalleryGrid
                slug={slug}
                onQuickEdit={onQuickEdit}
                docs={data?.docs || []}
                onLightbox={setLightboxIndex}
              />
            )}
            {view === 'justified' && (
              <MediaGalleryJustified
                slug={slug}
                onQuickEdit={onQuickEdit}
                docs={data?.docs || []}
                onLightbox={setLightboxIndex}
              />
            )}
          </React.Fragment>
        }
        Table={view !== 'list' ? hideTable : props.Table}
      />
      {lightboxIndex !== null &&
        data?.docs &&
        createPortal(
          <MediaGalleryLightbox
            docs={data.docs}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onQuickEdit={onQuickEdit}
          />,
          document.body,
        )}
    </React.Fragment>
  )
}
