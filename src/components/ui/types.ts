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
    card?: { url?: string; width?: number; height?: number }
    thumbnail?: { url?: string; width?: number; height?: number }
  }
  // biome-ignore lint/suspicious/noExplicitAny: allow arbitrary data
  originalData?: any
}
