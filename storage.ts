export interface GeneratedImage {
  id: string
  prompt: string
  style: string
  imageUrl: string
  timestamp: number
  isFavorite: boolean
}

export class ImageStorage {
  private static HISTORY_KEY = "text-to-image-history"
  private static FAVORITES_KEY = "text-to-image-favorites"

  private static setHistorySafe(history: GeneratedImage[]): void {
    // Keep at most 50 entries, but only keep imageUrl for the most recent few
    let maxEntries = 50
    let keepImageUrlFor = 6 // keep previews for recent items
    let attempt = 0

    const compact = (arr: GeneratedImage[], keep: number) => {
      return arr.slice(0, maxEntries).map((item, idx) => {
        // For items within keep threshold, always preserve the imageUrl
        if (idx < keep) {
          return item
        }
        // For older entries beyond keep threshold, drop imageUrl to save space
        return { ...item, imageUrl: "" }
      })
    }

    while (attempt < 6) {
      try {
        const compacted = compact(history, keepImageUrlFor)
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(compacted))
        return
      } catch (e) {
        // progressively degrade until it fits
        attempt += 1
        if (attempt === 1) {
          // keep imageUrl for fewer items
          keepImageUrlFor = Math.max(3, Math.floor(keepImageUrlFor / 2))
        } else if (attempt === 2) {
          keepImageUrlFor = 1
        } else if (attempt === 3) {
          // drop imageUrl for all
          keepImageUrlFor = 0
        } else if (attempt === 4) {
          // reduce total entries
          maxEntries = 20
        } else if (attempt === 5) {
          maxEntries = 5
        } else {
          break
        }
      }
    }

    // Final fallback: try to clear history entry to keep app usable
    try {
      const minimal: GeneratedImage[] = history.slice(0, 1).map((i) => ({ ...i, imageUrl: "" }))
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(minimal))
    } catch {
      // give up silently
    }
  }

  static saveImage(image: Omit<GeneratedImage, "id" | "timestamp">): GeneratedImage {
    const newImage: GeneratedImage = {
      ...image,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }

    const history = this.getHistory()
    history.unshift(newImage)

    this.setHistorySafe(history)

    return newImage
  }

  static getHistory(): GeneratedImage[] {
    if (typeof window === "undefined") return []
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY)
      const parsed = stored ? JSON.parse(stored) : []
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean)
      }
      return []
    } catch {
      return []
    }
  }

  static getFavorites(): GeneratedImage[] {
    return this.getHistory().filter((img) => img.isFavorite)
  }

  static toggleFavorite(imageId: string): void {
    const history = this.getHistory()
    const imageIndex = history.findIndex((img) => img.id === imageId)
    if (imageIndex !== -1) {
      history[imageIndex].isFavorite = !history[imageIndex].isFavorite
      this.setHistorySafe(history)
    }
  }

  static deleteImage(imageId: string): void {
    const history = this.getHistory()
    const filteredHistory = history.filter((img) => img.id !== imageId)
    this.setHistorySafe(filteredHistory)
  }

  static clearHistory(): void {
    localStorage.removeItem(this.HISTORY_KEY)
  }
}
