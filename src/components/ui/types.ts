export interface MediaItem {
  id: string | number
  title?: string
  src: string
  thumbnail?: string
  alt?: string
  filename?: string
  type: 'image' | 'video' | 'audio' | 'document'
  mimeType?: string
  width?: number
  height?: number
  focalX?: number
  focalY?: number
  href?: string
  sizes?: {
    thumbnail?: { url?: string; width?: number; height?: number }
    [key: string]: { url?: string; width?: number; height?: number } | undefined
  }
  // biome-ignore lint/suspicious/noExplicitAny: allow arbitrary data
  originalData?: any
}
