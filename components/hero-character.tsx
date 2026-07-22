"use client"

import { useEffect, useState } from "react"

type Pose = "left" | "center" | "right"

const poses: { key: Pose; src: string }[] = [
  { key: "left", src: "/assets/character-left.jpeg" },
  { key: "center", src: "/assets/character.jpeg" },
  { key: "right", src: "/assets/character-right.jpeg" },
]

export function HeroCharacter() {
  const [pose, setPose] = useState<Pose>("center")

  useEffect(() => {
    // Desktop (pointer devices with a real hover state) follows the mouse.
    const mq = window.matchMedia("(min-width: 768px) and (hover: hover)")

    if (!mq.matches) {
      // Mobile / no-hover: auto-cycle through the poses every 7s.
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (prefersReducedMotion) return

      const interval = setInterval(() => {
        setPose((current) => {
          const next = (poses.findIndex((p) => p.key === current) + 1) % poses.length
          return poses[next].key
        })
      }, 7000)
      return () => clearInterval(interval)
    }

    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth
        setPose(x < 0.35 ? "left" : x > 0.65 ? "right" : "center")
      })
    }
    window.addEventListener("mousemove", onMove)
    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  const shift = pose === "left" ? "-translate-x-2" : pose === "right" ? "translate-x-2" : "translate-x-0"

  return (
    <div
      className={`relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-out ${shift}`}
    >
      {poses.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p.key}
          src={p.src}
          alt={p.key === "center" ? "Mayowa AI character" : ""}
          aria-hidden={p.key !== "center"}
          draggable={false}
          className={`absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-300 ease-out ${
            pose === p.key ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  )
}
