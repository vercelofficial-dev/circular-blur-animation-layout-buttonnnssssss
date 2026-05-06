"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Download, RefreshCw, Sparkles, Moon, Sun, Wand2, AlertCircle, History, Heart } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { ImageHistory } from "@/components/history/image-history"
import { ImageStorage } from "@/lib/storage"
import { handleDownload } from "@/lib/download"
import { ClickSpark } from "@/components/ui/click-spark"
import ShinyText from "@/components/ui/shiny-text"
import GeistSpinner from "@/components/ui/geist-spinner" // Local spinner import
import FooterIconPill from "@/components/footer-icon-pill" // Import for the footer pill with three inner circles
import { ArtStyleDrawer } from "@/components/art-style-drawer"

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  style: string
  timestamp: Date
  isFavorite?: boolean
}

const stylesArray = [
  { value: "realistic", label: "Realistic" },
  { value: "comic", label: "Comic" },
  { value: "anime", label: "Anime" },
  { value: "digital-art", label: "Digital Art" },
  { value: "ghibli", label: "Ghibli Art" },
  { value: "minecraft", label: "Minecraft Style" },
  { value: "oil-painting", label: "Oil Painting" },
  { value: "watercolor", label: "Watercolor" },
]

export default function Home() {
  const [prompt, setPrompt] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("realistic")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [currentView, setCurrentView] = useState<"history" | "favorites">("history")
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isClipdropConfigured, setIsClipdropConfigured] = useState<boolean | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  // Pointer-driven pill indicator state (0 = home, 1 = history)
  const [pillDragProgress, setPillDragProgress] = useState<number | null>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number | null>(null)
  const isDragging = useRef(false)
  const { theme, setTheme } = useTheme()

  const isAmoledLight = theme === "aurora"

  const refreshRecentCreations = () => {
    const recentImages = ImageStorage.getHistory()
      .slice(0, 6)
      .map((img) => ({
        id: img.id,
        url: img.imageUrl,
        prompt: img.prompt,
        style: img.style,
        timestamp: new Date(img.timestamp),
        isFavorite: img.isFavorite,
      }))
    setGeneratedImages(recentImages)
  }

  useEffect(() => {
    refreshRecentCreations()
    const timer = setTimeout(() => setIsPageLoaded(true), 100)
    fetch("/api/config")
      .then((res) => res.json())
      .then((data: { clipdropConfigured?: boolean }) => {
        setIsClipdropConfigured(Boolean(data?.clipdropConfigured))
      })
      .catch(() => setIsClipdropConfigured(false))
    return () => clearTimeout(timer)
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Prompt Required", {
        description: "Please enter a prompt to generate an image.",
      })
      return
    }

    if (navigator.vibrate) {
      navigator.vibrate(42)
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image")
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: data.imageUrl,
        prompt: data.prompt,
        style: data.style,
        timestamp: new Date(),
      }

      ImageStorage.saveImage({
        prompt: data.prompt,
        style: data.style,
        imageUrl: data.imageUrl,
        isFavorite: false,
      })

      setGeneratedImages((prev) => [newImage, ...prev.slice(0, 5)])

      toast.success("Image Generated!", {
        description: "Your AI artwork has been created successfully.",
      })
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Generation Failed", {
        description: error instanceof Error ? error.message : "Failed to generate image. Please try again.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSurpriseMe = async () => {
    if (navigator.vibrate) {
      navigator.vibrate(42)
    }

    const tryFetch = async (): Promise<string | null> => {
      try {
        const response = await fetch(`/api/surprise-prompt?ts=${Date.now()}`, {
          cache: "no-store",
        })
        const data = await response.json()
        if (data?.success && typeof data.prompt === "string") {
          return data.prompt
        }
        return null
      } catch {
        return null
      }
    }

    // Try up to 3 attempts to avoid repeating current prompt
    let newPrompt: string | null = null
    for (let i = 0; i < 3; i++) {
      const p = await tryFetch()
      if (p && p.trim() && p !== prompt) {
        newPrompt = p
        break
      }
    }

    if (!newPrompt) {
      // Fallback locally if API failed or kept matching the same prompt
      const fallbackPrompts = [
        "A majestic dragon soaring through aurora-filled skies",
        "A cyberpunk cityscape with neon reflections in rain puddles",
        "A cozy library inside a giant tree with glowing books",
      ]
      const filtered = fallbackPrompts.filter((p) => p !== prompt)
      newPrompt = filtered[Math.floor(Math.random() * filtered.length)] ?? fallbackPrompts[0]
    }

    setPrompt(newPrompt)
    toast("Surprise!", {
      description: "Here's a creative prompt for you to try.",
    })
  }

  const handleRegenerate = async (imagePrompt: string, imageStyle: string) => {
    setPrompt(imagePrompt)
    setSelectedStyle(imageStyle)
    setShowHistory(false)

    setTimeout(() => {
      handleGenerate()
    }, 100)
  }

  const handleToggleFavorite = (imageId: string) => {
    ImageStorage.toggleFavorite(imageId)
    refreshRecentCreations()
    toast("Favorites Updated", {
      description: "Image favorite status has been updated.",
    })
  }

  const handleHistoryUpdate = () => {
    refreshRecentCreations()
  }

  const handleStyleSelect = (styleValue: string) => {
    setSelectedStyle(styleValue)
  }

  // Pointer handlers for gesture-driven pill indicator
  const handlePillPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX
    isDragging.current = false
    setPillDragProgress(null)
  }, [])

  const handlePillPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null || !pillRef.current) return
    const pillWidth = pillRef.current.offsetWidth
    const segmentWidth = pillWidth / 2
    const dx = e.clientX - dragStartX.current
    if (Math.abs(dx) > 4) isDragging.current = true
    if (!isDragging.current) return
    // Current indicator offset: if on home (showHistory=false), base=0; else base=segmentWidth
    const base = showHistory ? segmentWidth : 0
    const raw = (base + dx) / segmentWidth
    // Clamp 0..1 with light rubber-band beyond edges
    const clamped = Math.max(-0.12, Math.min(1.12, raw))
    setPillDragProgress(clamped)
  }, [showHistory])

  const handlePillPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || pillDragProgress === null) {
      setPillDragProgress(null)
      dragStartX.current = null
      return
    }
    // Commit: snap to whichever half the indicator is closest to
    const goHistory = pillDragProgress >= 0.5
    setPillDragProgress(null)
    dragStartX.current = null
    isDragging.current = false
    handleHistoryToggle(goHistory)
  }, [pillDragProgress])

  const handleHistoryToggle = (value: boolean) => {
    if (value && !showHistory) {
      // Only animate when going TO history (value=true) AND currently NOT on history page
      setIsTransitioning(true)
      setTimeout(() => {
        setShowHistory(value)
        setIsTransitioning(false)
      }, 200)
    } else if (!value) {
      // No transition animation when clicking Visura logo to go home
      setShowHistory(value)
    }
    // If value=true AND showHistory=true, do nothing (already on history, no animation)
  }

  return (
    <div className="min-h-screen bg-background" data-vaul-drawer-wrapper="">
      {/* Header */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div
          ref={pillRef}
          className={`professional-card bg-[#151515]/70 backdrop-blur-md border border-border rounded-full px-0 py-1 shadow-lg hover:shadow-xl transition-all duration-500 ${isPageLoaded ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"} relative select-none touch-none`}
          onPointerDown={handlePillPointerDown}
          onPointerMove={handlePillPointerMove}
          onPointerUp={handlePillPointerUp}
          onPointerCancel={handlePillPointerUp}
        >
          {/* Gesture-driven sliding indicator */}
          <span
            className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] bg-foreground/10 will-change-transform${pillDragProgress === null ? " transition-transform duration-[420ms] ease-[cubic-bezier(0.4,0,0.2,1)]" : ""}`}
            aria-hidden="true"
            style={{
              borderRadius: "8px",
              transform: pillDragProgress !== null
                ? `translateX(${pillDragProgress * 100}%)`
                : showHistory ? "translateX(100%)" : "translateX(0%)",
            }}
          />
          {/* Segments */}
          <div
            className="relative z-10 grid grid-cols-2 gap-0"
            style={{ ["--pill-segment-w" as any]: "3rem" }} // default 3.5rem
          >
            {/* Visura segment (home) */}
            <button
              type="button"
              onClick={() => handleHistoryToggle(false)}
              className="inline-flex h-9 w-[var(--pill-segment-w)] items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
              aria-label="Home"
              aria-current={!showHistory}
              title="Home"
            >
              <img
                src="/images/visura-logo.png"
                alt="Visura Logo"
                className="h-11 w-11 transition-transform duration-300
                -translate-y-0.5
                translate-x-0.5"
              />
            </button>

            {/* History segment */}
            <button
              type="button"
              onClick={() => handleHistoryToggle(true)}
              className="inline-flex h-9 w-[var(--pill-segment-w)] items-center justify-center rounded-full text-foreground/90 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
              aria-label="History"
              aria-current={showHistory}
              title="History"
            >
              <History
                className="h-5.3 w-5.3 
              -translate-x-0.469
              translate-y-0.479"
              />
            </button>
          </div>
        </div>
      </header>

      <div className="fixed top-4 right-4 z-50">
        <div
          className={`professional-card bg-background/80 backdrop-blur-md border border-border rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all duration-500 ${isPageLoaded ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
          style={{ borderRadius: "100px" }}
        >
          <button
            type="button"
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(42)
              setTheme(theme === "dark" ? "aurora" : "dark")
            }}
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-foreground"
            aria-label="Toggle theme"
            title="Toggle theme"
            style={{ borderRadius: "100px" }}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </button>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 pt-24">
        {showHistory ? (
          <div
            className={`space-y-6 transition-all duration-500 ${isTransitioning ? "opacity-0 [filter:blur(1px)]" : "opacity-100 [filter:blur(0px)]"} ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${isPageLoaded && !isTransitioning ? "animate-page-transition" : ""}`}
          >
            <div className="flex items-center justify-between mb-8 px-4">
              <Button
                variant="outline"
                onClick={() => handleHistoryToggle(false)}
                className="professional-card hover:bg-accent/5 border-border transition-all duration-300 hover:scale-105 rounded-full px-4 py-2 flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to home
              </Button>
              <div className="w-full flex justify-center mt-8">
                <h2 className="text-center text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 bg-clip-text text-transparent">
                  Your Visura Collection
                </h2>
              </div>
              <div className="w-[140px]"></div>
            </div>

            <div className="flex gap-2 mb-6">
              <Button
                variant={currentView === "history" ? "default" : "outline"}
                onClick={() => setCurrentView("history")}
                className={
                  currentView === "history"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 rounded-full px-4 py-2 flex items-center gap-2"
                    : "professional-card hover:bg-accent/5 border-border transition-all duration-300 hover:scale-105"
                }
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button
                variant={currentView === "favorites" ? "default" : "outline"}
                onClick={() => setCurrentView("favorites")}
                className={
                  currentView === "favorites"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105"
                    : "professional-card hover:bg-accent/5 border-border transition-all duration-300 hover:scale-105"
                }
              >
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </Button>
            </div>
            <ImageHistory
              onRegenerate={handleRegenerate}
              onHistoryUpdate={handleHistoryUpdate}
              showFavoritesOnly={currentView === "favorites"}
            />
          </div>
        ) : (
          <div className={`animate-slide-in-right ${isTransitioning ? "opacity-0 [filter:blur(1px)]" : "opacity-100 [filter:blur(0px)]"}`}>
            {isClipdropConfigured === false && (
              <Card
                className={`professional-card border-destructive/20 bg-destructive/5 p-4 mb-6 max-w-4xl mx-auto transition-all duration-500 ${isPageLoaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
              >
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">
                    <strong>Setup Required:</strong> Add your Clipdrop API key in Project Settings as{" "}
                    <code>CLIPDROP_API_KEY</code> to enable image generation.
                  </p>
                </div>
              </Card>
            )}

            <Card
              className={`professional-card p-8 mb-8 max-w-4xl mx-auto transition-all duration-700 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="space-y-6">
                <div className="text-center">
                  <div className="blur-text-container mb-4">
                    <h2 className="text-center blur-text-animate bg-gradient-to-r from-gray-300 via-white to-gray-400 bg-clip-text text-transparent" style={{ fontFamily: "'StingerTrial', sans-serif", fontSize: "30px", fontWeight: "400" }}>
                      <span
                        className="blur-text-word blur-text-animate bg-gradient-to-r from-gray-600 via-gray-400 to-gray-300 bg-clip-text text-transparent"
                        style={{ animationDelay: "0.3s", fontFamily: "'StingerTrial', sans-serif", fontSize: "30px", fontWeight: "400", fontStyle: "normal" }}
                      >
                        Create
                      </span>{" "}
                      <span
                        className="blur-text-word blur-text-animate bg-gradient-to-r from-gray-300 via-gray-300 to-gray-300 bg-clip-text text-transparent"
                        style={{ animationDelay: "0.9s", fontFamily: "'StingerTrial', sans-serif", fontSize: "30px", fontWeight: "400", fontStyle: "normal" }}
                      >
                        with
                      </span>{" "}
                      <span
                        className="blur-text-word blur-text-animate bg-gradient-to-r from-gray-300 via-gray-400 to-gray-400 bg-clip-text text-transparent"
                        style={{ animationDelay: "1.2s", fontFamily: "'StingerTrial', sans-serif", fontSize: "30px", fontWeight: "400", fontStyle: "normal" }}
                      >
                        Visura
                      </span>
                    </h2>
                  </div>
                  <p className="text-muted-foreground">Transform your imagination into stunning visuals</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Your Prompt</label>
                    <Input
                      placeholder="your wonderful prompt..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="professional-card border-border focus:border-primary/50 transition-all duration-300 focus:scale-[1.02]"
                      onKeyDown={(e) => e.key === "Enter" && !isGenerating && handleGenerate()}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Art Style</label>
                    <div className="relative">
                      <ArtStyleDrawer
                        value={selectedStyle}
                        onChange={handleStyleSelect}
                        options={stylesArray}
                        triggerClassName="rounded-lg"
                        hideTriggerLabel
                      />
                    </div>
                  </div>
                </div>

                {/* Actions: Surprise Me + Generate/Generating */}
                <div className="flex gap-3 justify-center items-center flex-nowrap">
                  <ClickSpark sparkColor="#fbbf24" sparkCount={6}>
                    <Button
                      onClick={handleSurpriseMe}
                      variant="outline"
                      disabled={isGenerating}
                      className="professional-card hover:bg-accent/5 transition-all duration-300 border-border bg-transparent hover:scale-105 shrink-0 whitespace-nowrap"
                    >
                      <Sparkles className="h-4 w-4 mr-2 transition-transform duration-300 hover:rotate-12" />
                      Surprise Me
                    </Button>
                  </ClickSpark>

                  <ClickSpark sparkColor="#3b82f6" sparkCount={8}>
                    <Button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className={
                        isGenerating
                          ? "professional-card border text-primary-foreground transition-all duration-300 hover:scale-105 shrink-0 whitespace-nowrap disabled:opacity-100"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:scale-105 shrink-0 whitespace-nowrap"
                      }
                    >
                      {isGenerating ? (
                        <>
                          <span className="mr-2 inline-flex items-center" style={{ marginLeft: "-5px" }}>
                            <GeistSpinner color="#C9C9C9" size={21} />
                          </span>
                          <ShinyText
                            text="Generating..."
                            disabled={false}
                            speed={2.3}
                            className="text-primary-foreground"
                          />
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </ClickSpark>
                </div>
              </div>
            </Card>

            {generatedImages.length > 0 && (
              <div
                className={`space-y-6 transition-all duration-700 delay-200 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-foreground">Recent Creations</h3>
                  <Button
                    variant="outline"
                    onClick={() => handleHistoryToggle(true)}
                    className="professional-card hover:bg-accent/5 border-border transition-all duration-300 hover:scale-105"
                  >
                    <History className="h-4 w-4 mr-1" />
                    View All History
                  </Button>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {generatedImages.map((image, index) => (
                    <Card
                      key={image.id}
                      className={`professional-card overflow-hidden group hover:shadow-lg transition-all duration-500 hover:scale-[1.02] ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                      style={{ transitionDelay: `${300 + index * 100}ms` }}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={image.prompt}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <p className="font-medium text-sm line-clamp-2 text-foreground">{image.prompt}</p>
                          <p className="text-xs text-muted-foreground capitalize">{image.style.replace("-", " ")}</p>
                        </div>

                        <div className="flex gap-2 justify-center">
                          <ClickSpark sparkColor="#10b981" sparkCount={4}>
                            <Button
                              size="sm"
                              onClick={() => {
                                const ok = handleDownload(image.url, image.prompt)
                                if (ok) {
                                  toast("Download Started", {
                                    description: "Your image is being downloaded.",
                                  })
                                } else {
                                  toast.error("Download Failed", {
                                    description: "Failed to download the image. Please try again.",
                                  })
                                }
                              }}
                              className="flex-1 professional-card hover:bg-accent/5 transition-all duration-300 border-border hover:scale-105"
                              variant="outline"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </ClickSpark>
                          <ClickSpark sparkColor="#ef4444" sparkCount={6}>
                            <Button
                              size="sm"
                              onClick={() => handleToggleFavorite(image.id)}
                              className={`professional-card hover:bg-accent/5 transition-all duration-300 border-border hover:scale-110 ${image.isFavorite ? "text-red-500 hover:text-red-600" : "hover:text-red-500"}`}
                              variant="outline"
                            >
                              <Heart
                                className={`h-3 w-3 transition-all duration-300 ${image.isFavorite ? "fill-current animate-pulse" : ""}`}
                              />
                            </Button>
                          </ClickSpark>
                          <ClickSpark sparkColor="#8b5cf6" sparkCount={5}>
                            <Button
                              size="sm"
                              onClick={() => handleRegenerate(image.prompt, image.style)}
                              className="flex-1 professional-card hover:bg-accent/5 transition-all duration-300 border-border hover:scale-105"
                              variant="outline"
                              disabled={isGenerating}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Regenerate
                            </Button>
                          </ClickSpark>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {generatedImages.length === 0 && !isGenerating && (
              <div
                className={`text-center py-16 transition-all duration-700 delay-300 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <Wand2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 transition-transform duration-300 hover:rotate-12" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">Ready to Create with Visura?</h3>
                <p className="text-muted-foreground">Enter a prompt above and watch AI bring your ideas to life</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-8 text-center">
        {/* Insert the outer pill with three small circles above the credit line */}
        <div className="mb-4 flex justify-center">
          <FooterIconPill />
        </div>
        <p className="text-sm animated-gradient-text" style={{ fontFamily: "'HemingVariable', sans-serif" }}>
          Created with love by{" "}
          <a
            href="https://youtube.com/@VivekThinks"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
            style={{ fontFamily: "'HemingVariable', sans-serif" }}
          >
            Vivek
          </a>
        </p>
      </footer>
    </div>
  )
}
