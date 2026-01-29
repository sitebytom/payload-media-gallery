export const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v']
export const AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'm4a',
  'ogg',
  'flac',
  'aac',
  'wma',
  'm4r',
  'aiff',
  'alac',
]
export const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'avif',
  'bmp',
  'ico',
  'tiff',
]
export const DOCUMENT_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'rtf',
  'csv',
  'zip',
  'rar',
  '7z',
]

export const getMimeType = (filename?: string, docMimeType?: string): string => {
  if (docMimeType) return docMimeType
  const ext = filename?.split('.').pop()?.toLowerCase() || ''
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image/' + ext
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video/' + ext
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio/' + ext
  if (DOCUMENT_EXTENSIONS.includes(ext)) return 'application/' + ext
  return ''
}

export const isVideoMime = (mimeType?: string) => !!mimeType?.startsWith('video/')
export const isAudioMime = (mimeType?: string) => !!mimeType?.startsWith('audio/')
export const isImageMime = (mimeType?: string) => !!mimeType?.startsWith('image/')
export const isDocumentMime = (mimeType?: string) => {
  return !isVideoMime(mimeType) && !isAudioMime(mimeType) && !isImageMime(mimeType)
}
