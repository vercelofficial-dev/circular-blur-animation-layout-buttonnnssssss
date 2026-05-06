"use client"

import type React from "react"

export default function FooterIconPill() {
  const OUTER_BG = "#0A0A0A"
  const OUTER_BORDER = "#222222"
  const INNER_BG = "#000000" // AMOLED black
  const INNER_BORDER = "#222222"

  const CIRCLE_SIZE = 30 // px
  const OUTER_BORDER_WIDTH = 1.5
  const INNER_BORDER_WIDTH = 1.5
  const OUTER_PAD_Y = 3 // px - small breathing room between circle border and outer border
  const OUTER_PAD_X = 3 // px

  const circleStyle: React.CSSProperties = {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    backgroundColor: INNER_BG,
    borderColor: INNER_BORDER,
    borderWidth: INNER_BORDER_WIDTH,
  }

  const iconClass = "w-6 h-6 object-contain pointer-events-none select-none"

  return (
    <div className="w-full flex justify-center">
      <div
        className="rounded-full border-2"
        style={{
          backgroundColor: OUTER_BG,
          borderColor: OUTER_BORDER,
          borderWidth: OUTER_BORDER_WIDTH,
          padding: `${OUTER_PAD_Y}px ${OUTER_PAD_X}px`,
        }}
        aria-label="Social links"
      >
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Vivek5419"
            target="_blank"
            rel="noopener noreferrer"
            className="grid place-items-center rounded-full border transform-gpu transition duration-200 ease-out hover:scale-[1.04] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={circleStyle}
            aria-label="GitHub"
            title="GitHub"
          >
            <img src="/icons/github.png" alt="GitHub" className={iconClass} />
          </a>

          <a
            href="https://www.reddit.com/u/Vivek5419/"
            target="_blank"
            rel="noopener noreferrer"
            className="grid place-items-center rounded-full border transform-gpu transition duration-200 ease-out hover:scale-[1.04] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={circleStyle}
            aria-label="Reddit"
            title="Reddit"
          >
            <img src="/icons/reddit.png" alt="Reddit" className={iconClass} />
          </a>

          <a
            href="mailto:vivek.5419kumar@gmail.com"
            className="grid place-items-center rounded-full border transform-gpu transition duration-200 ease-out hover:scale-[1.04] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={circleStyle}
            aria-label="Email"
            title="Email"
          >
            <img src="/icons/gmail.png" alt="Gmail" className={iconClass} />
          </a>
        </div>
      </div>
    </div>
  )
}
