"use client"

import * as React from "react"
import { Drawer } from "vaul"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

type ArtStyleOption = { value: string; label: string }

interface ArtStyleDrawerProps {
  value: string
  onChange: (style: string) => void
  options: ArtStyleOption[]
  className?: string
  triggerClassName?: string
  hideTriggerLabel?: boolean
}

export function ArtStyleDrawer({
  value,
  onChange,
  options,
  className,
  triggerClassName,
  hideTriggerLabel,
}: ArtStyleDrawerProps) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState<string | null>(null)
  const mountedRef = React.useRef(true)
  const { theme } = useTheme()

  React.useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const activeLabel = options.find((o) => o.value === value)?.label ?? value

  const commitSelection = React.useCallback(() => {
    if (pending != null && pending !== value && mountedRef.current) {
      onChange(pending)
    }
  }, [pending, value, onChange])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!mountedRef.current) return

      if (next) {
        setPending(value)
        setOpen(true)
      } else {
        requestAnimationFrame(() => {
          if (mountedRef.current) {
            commitSelection()
            setOpen(false)
            setTimeout(() => {
              if (mountedRef.current) {
                setPending(null)
              }
            }, 50)
          }
        })
      }
    },
    [value, commitSelection],
  )

  const handleClose = React.useCallback(() => {
    if (!mountedRef.current) return

    requestAnimationFrame(() => {
      if (mountedRef.current) {
        commitSelection()
        setOpen(false)
        setTimeout(() => {
          if (mountedRef.current) {
            setPending(null)
          }
        }, 50)
      }
    })
  }, [commitSelection])

  const handleOptionSelect = React.useCallback((optionValue: string) => {
    if (mountedRef.current) {
      setPending(optionValue)
    }
  }, [])

  return (
    <Drawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      dismissible
      shouldScaleBackground
      backgroundColor="rgba(0, 0, 0, 0.8)"
    >
      <Drawer.Trigger asChild>
        <button
          type="button"
          aria-label="Choose art style"
          className={cn(
            "w-full professional-card border-border focus:border-primary/50 bg-background text-foreground px-3 py-2",
            "text-left flex items-center justify-between hover:bg-accent/5 transition-all duration-300 hover:scale-[1.02] rounded-lg",
            triggerClassName,
          )}
        >
          {!hideTriggerLabel ? <span>Art Style</span> : null}
          <span className="text-muted-foreground">{activeLabel}</span>
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/80" />
        <Drawer.Content
          onWheel={(e) => e.preventDefault()}
          className={cn(
            "fixed inset-x-0 bottom-0 z-[100]",
            "rounded-t-2xl border border-border bg-popover shadow-2xl",
            "backdrop-blur-xl bg-popover/80",
            "max-h-[95dvh] min-h-[50dvh] overflow-hidden no-scrollbar overscroll-none",
          )}
        >
          <div className="mx-auto mt-6 h-1.5 w-12 rounded-full bg-muted-foreground/70" aria-hidden />

          <div className={cn("px-5 pb-6 pt-8", className)}>
            <h3 className="text-base font-semibold text-foreground text-center">Select Art Style</h3>

            <ul className="mt-4 grid grid-cols-2 gap-2">
              {options.map((opt) => {
                const draft = pending ?? value
                const isActive = opt.value === draft
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => handleOptionSelect(opt.value)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2 text-sm transition-all duration-300",
                        theme === "aurora"
                          ? isActive
                            ? "border-purple-500/50 bg-purple-500/10 text-white backdrop-blur-sm shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/30"
                            : "border-white/10 bg-white/5 text-white/90 hover:border-purple-500/30 hover:bg-purple-500/5 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                          : isActive
                            ? "border-white/30 bg-white/5 text-white backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/75"
                            : "border-white/5 bg-white/2 text-white/90 hover:border-white/15 hover:bg-white/3 backdrop-blur-sm hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]",
                      )}
                      aria-pressed={isActive}
                    >
                      {opt.label}
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  "relative overflow-hidden group rounded-full border transition-all duration-300",
                  "px-4 py-2 text-sm text-white/90",
                  "border-white/10 bg-white/5 backdrop-blur-sm",
                  "hover:border-white/20 hover:bg-white/10 hover:text-white",
                  "before:absolute before:inset-0 before:bg-white/10",
                  "before:origin-bottom before:scale-y-0 before:transition-transform before:duration-300",
                  "group-active:before:scale-y-100",
                  "isolate",
                )}
              >
                <span className="relative z-10">Close</span>
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
