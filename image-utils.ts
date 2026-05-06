export class ImageUtils {
  private static cache = new Map<string, string>()

  static async optimizeAndCache(imageUrl: string): Promise<string> {
    // Check if already cached
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!
    }

    try {
      // Create optimized version
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      return new Promise((resolve, reject) => {
        img.crossOrigin = "anonymous"
        img.onload = () => {
          // Set canvas size (max 1024px)
          const maxSize = 1024
          const ratio = Math.min(maxSize / img.width, maxSize / img.height)
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio

          // Draw and compress
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
          const optimizedUrl = canvas.toDataURL("image/jpeg", 0.8)

          // Cache the result
          this.cache.set(imageUrl, optimizedUrl)
          resolve(optimizedUrl)
        }
        img.onerror = () => resolve(imageUrl) // Fallback to original
        img.src = imageUrl
      })
    } catch (error) {
      console.error("Image optimization failed:", error)
      return imageUrl // Fallback to original
    }
  }

  static async downloadImage(imageUrl: string, filename: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error("Failed to fetch image")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      return true
    } catch (error) {
      console.error("Download failed:", error)
      return false
    }
  }

  static async downloadMultiple(images: Array<{ url: string; prompt: string }>): Promise<void> {
    const zip = await import("jszip")
    const JSZip = zip.default
    const zipFile = new JSZip()

    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      try {
        const response = await fetch(image.url)
        const blob = await response.blob()
        const filename = `${image.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-")}-${i + 1}.png`
        zipFile.file(filename, blob)
      } catch (error) {
        console.error(`Failed to add image ${i + 1} to zip:`, error)
      }
    }

    const content = await zipFile.generateAsync({ type: "blob" })
    const url = window.URL.createObjectURL(content)
    const date = new Date().toISOString().split("T")[0]
    const link = document.createElement("a")
    link.href = url
    link.download = images.length === 1
      ? `Visura-image-${date}.zip`
      : `Visura-images-${date}.zip`
    document.body.appendChild(link)
    link.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
  }

  static clearCache(): void {
    this.cache.clear()
  }

  static getCacheSize(): number {
    return this.cache.size
  }
}
