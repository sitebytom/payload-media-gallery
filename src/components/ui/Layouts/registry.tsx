import { GridViewIcon, JustifiedIcon, MasonryIcon } from '../../../icons'
import type { MediaItem } from '../types'
import { Grid } from './Grid'
import { Justified } from './Justified'
import { Masonry } from './Masonry'

export interface ViewComponentProps {
  onQuickEdit: (id: string | number) => void
  items: MediaItem[]
  onLightbox: (index: number) => void
  handleSelection?: (item: MediaItem) => void
  variant?: 'default' | 'overlay'
  collectionLabel?: string
}

export interface LayoutConfig {
  label: string
  component: React.ComponentType<ViewComponentProps>
  variant?: 'default' | 'overlay'
  icon: React.ReactNode
}

export const layoutRegistry: Record<string, LayoutConfig> = {
  justified: {
    label: 'Justified',
    component: Justified,
    variant: 'overlay',
    icon: <JustifiedIcon />,
  },
  masonry: {
    label: 'Masonry',
    component: Masonry,
    variant: 'overlay',
    icon: <MasonryIcon />,
  },
  grid: {
    label: 'Grid',
    component: Grid,
    variant: 'overlay',
    icon: <GridViewIcon />,
  },
}

export type ViewType = keyof typeof layoutRegistry | 'list'
