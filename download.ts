export const handleDownload = (imageUrl: string, prompt: string) => {
  try {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `Visura:-${prompt.slice(0, 20).replace(/\s+/g, "-")}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  } catch (error) {
    console.error("Download failed:", error)
    return false
  }
}
