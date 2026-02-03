'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'

interface SortableItemProps {
  id: string | number
  children: React.ReactNode
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
}

interface InjectedProps {
  dragAttributes?: Record<string, unknown>
  dragListeners?: Record<string, (...args: unknown[]) => unknown>
  isDragging?: boolean
}

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  children,
  disabled,
  className,
  style: styleProp,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : undefined,
    position: 'relative' as const,
    ...styleProp,
  }

  return (
    <div ref={setNodeRef} style={style} className={`sortable-item ${className || ''}`}>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<InjectedProps>, {
            dragAttributes: attributes as unknown as Record<string, unknown>,
            dragListeners: listeners as unknown as Record<string, (...args: unknown[]) => unknown>,
            isDragging,
          })
        : children}
    </div>
  )
}
