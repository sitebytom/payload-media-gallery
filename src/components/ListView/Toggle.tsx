'use client'

import { Button } from '@payloadcms/ui'
import type React from 'react'
import { GridViewIcon, JustifiedIcon, ListViewIcon } from '../../icons'

import type { ViewType } from './index'

interface ToggleProps {
  view: ViewType
  activeView: ViewType
  onToggle: (view: ViewType) => void
}

const VIEW_CONFIG: Record<ViewType, { icon: React.ReactNode; tooltip: string }> = {
  justified: {
    icon: <JustifiedIcon />,
    tooltip: 'Justified View',
  },
  grid: {
    icon: <GridViewIcon />,
    tooltip: 'Grid View',
  },
  list: {
    icon: <ListViewIcon />,
    tooltip: 'List View',
  },
}

export const Toggle = ({ view, activeView, onToggle }: ToggleProps) => {
  const config = VIEW_CONFIG[view]

  return (
    <Button
      buttonStyle="pill"
      className={`media-gallery-toggle${view === activeView ? ' media-gallery-toggle--active' : ''}`}
      icon={config.icon}
      margin={false}
      onClick={() => onToggle(view)}
      size="small"
      tooltip={config.tooltip}
    />
  )
}
