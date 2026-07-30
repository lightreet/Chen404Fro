import { onBeforeUnmount } from 'vue'
import { getReaderAssetBlob } from '@/api/reader'

export function useReaderAssetResolver() {
  const objectUrls = new Set<string>()

  const revokeAll = () => {
    objectUrls.forEach((url) => URL.revokeObjectURL(url))
    objectUrls.clear()
  }

  const resolveUrl = async (url?: string) => {
    if (!url) return ''
    const blob = await getReaderAssetBlob(url)
    const objectUrl = URL.createObjectURL(blob)
    objectUrls.add(objectUrl)
    return objectUrl
  }

  const resolveHtml = async (html: string) => {
    revokeAll()
    const document = new DOMParser().parseFromString(html, 'text/html')
    const images = [...document.querySelectorAll<HTMLImageElement>('img[src]')]
    await Promise.all(images.map(async (image) => {
      const src = image.getAttribute('src') || ''
      if (!src.includes('/reader/books/') || !src.includes('/assets/')) return
      try {
        image.src = await resolveUrl(src)
      } catch {
        const fallback = document.createElement('span')
        fallback.className = 'reader-image-fallback'
        fallback.textContent = image.alt ? `〔插图：${image.alt}〕` : '〔插图加载失败〕'
        image.replaceWith(fallback)
      }
    }))
    return document.body.innerHTML
  }

  onBeforeUnmount(revokeAll)

  return {
    resolveUrl,
    resolveHtml,
    revokeAll,
  }
}
