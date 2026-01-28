'use client'

import { DefaultListView, useDocumentDrawer, useListQuery, usePreferences } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Grid } from '../Gallery/Grid'
import { Justified } from '../Gallery/Justified'
import { Lightbox } from '../Lightbox'
import { SelectionToggle } from './SelectionToggle'
import { Toggle } from './Toggle'
import '../../index.scss'

export type ViewType = 'list' | 'grid' | 'justified'

// biome-ignore lint/suspicious/noExplicitAny: generic component props
export const ListView: React.FC<any> = (props) => {
  const router = useRouter()
  // biome-ignore lint/suspicious/noExplicitAny: props are dynamic
  const { collectionConfig } = props as any
  const slug = collectionConfig?.slug || 'media'
  const PREFERENCE_KEY = `payload-${slug}-view`

  const { getPreference, setPreference } = usePreferences()
  const { data: listData } = useListQuery()

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
      if (savedView && ['list', 'grid', 'justified'].includes(savedView)) {
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
  const viewOptions: ViewType[] = ['justified', 'grid', 'list']

  const listProps = {
    ...props,
    beforeActions: [
      ...(props.beforeActions || []),
      <SelectionToggle key="selection-toggle" />,
      ...viewOptions.map((viewOption) => (
        <Toggle
          key={`view-toggle-${viewOption}`}
          view={viewOption}
          activeView={viewType}
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
            {viewType === 'grid' && (
              <Grid
                slug={slug}
                docs={listData?.docs || []}
                onQuickEdit={handleQuickEdit}
                onLightbox={(index) => {
                  setLightboxIndex(index)
                  setLightboxOpen(true)
                }}
              />
            )}

            {viewType === 'justified' && (
              <Justified
                slug={slug}
                docs={listData?.docs || []}
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
        listData?.docs &&
        createPortal(
          <Lightbox
            docs={listData.docs}
            initialIndex={lightboxIndex ?? 0}
            onClose={() => setLightboxOpen(false)}
            onQuickEdit={handleQuickEdit}
          />,
          document.body,
        )}
    </React.Fragment>
  )
}
