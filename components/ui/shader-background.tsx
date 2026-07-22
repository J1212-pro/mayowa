"use client"

import { MeshGradient } from "@paper-design/shaders-react"

export function ShaderBackground({
  colors = ["#000000", "#170606", "#ff2b2b", "#4a0d0d"],
  speed = 0.45,
  className = "",
}: {
  colors?: string[]
  speed?: number
  className?: string
}) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <MeshGradient className="h-full w-full" colors={colors} speed={speed} />
    </div>
  )
}
