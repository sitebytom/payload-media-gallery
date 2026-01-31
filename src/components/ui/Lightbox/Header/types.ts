export interface LightboxHeaderProps {
  currentIndex: number
  totalItems: number
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  showThumbnails: boolean
  setShowThumbnails: (show: boolean) => void
  toggleFullscreen: () => void
  onClose: () => void
  onEdit?: () => void
}
