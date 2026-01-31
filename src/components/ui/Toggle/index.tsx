'use client'

import { Button } from '@payloadcms/ui'
import type React from 'react'
import './index.scss'

export interface ToggleProps {
  view: string
  activeView: string
  onToggle: (view: any) => void
  icon: React.ReactNode
  tooltip: string
}

export const Toggle = ({ view, activeView, onToggle, icon, tooltip }: ToggleProps) => {
  return (
    <Button
      buttonStyle="pill"
      className={`media-gallery-toggle${view === activeView ? ' media-gallery-toggle--active' : ''}`}
      icon={icon}
      margin={false}
      onClick={() => onToggle(view)}
      size="small"
      tooltip={tooltip}
    />
  )
}
