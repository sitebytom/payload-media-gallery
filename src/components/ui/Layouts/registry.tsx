import { GridViewIcon, JustifiedIcon, MasonryIcon } from '../../../icons'
import type { MediaItem } from '../types'
import { Grid } from './Grid'
import { Justified } from './Justified'
import { Masonry } from './Masonry'

export interface ViewComponentProps {
  onQuickEdit?: (id: string | number) => void
  items: MediaItem[]
  onLightbox?: (index: number) => void
  handleSelection?: (item: MediaItem) => void
  footer?: 'always' | 'hover'
  collectionLabel?: string
  collectionSlug: string
}

export interface LayoutConfig {
  label: string
  component: React.ComponentType<ViewComponentProps>
  footer?: 'always' | 'hover'
  icon: React.ReactNode
}

export const layoutRegistry: Record<string, LayoutConfig> = {
  justified: {
    label: 'Justified',
    component: Justified,
    footer: 'hover',
    icon: <JustifiedIcon />,
  },
  masonry: {
    label: 'Masonry',
    component: Masonry,
    footer: 'hover',
    icon: <MasonryIcon />,
  },
  grid: {
    label: 'Grid',
    component: Grid,
    footer: 'hover',
    icon: <GridViewIcon />,
  },
}

export type ViewType = keyof typeof layoutRegistry | 'list'
