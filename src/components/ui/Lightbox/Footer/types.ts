import type { LightboxItem } from '../types'

export interface LightboxFooterProps {
  currentItem: LightboxItem
  items: LightboxItem[]
  currentIndex: number
  setCurrentIndex: (index: number) => void
  setIsLoading: (loading: boolean) => void
  showThumbnails: boolean
}
