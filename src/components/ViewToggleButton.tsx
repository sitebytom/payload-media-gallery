'use client'

import { Button } from '@payloadcms/ui'
import { GridViewIcon, JustifiedIcon, ListViewIcon } from '../Icons'

type ViewType = 'list' | 'grid' | 'justified'

interface ViewToggleButtonProps {
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

export const ViewToggleButton = ({ view, activeView, onToggle }: ViewToggleButtonProps) => {
  const config = VIEW_CONFIG[view]

  return (
    <Button
      buttonStyle="pill"
      className={`folder-view-toggle-button${view === activeView ? ' folder-view-toggle-button--active' : ''}`}
      icon={config.icon}
      margin={false}
      onClick={() => onToggle(view)}
      size="small"
      tooltip={config.tooltip}
    />
  )
}
