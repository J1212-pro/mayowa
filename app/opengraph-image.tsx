import { ImageResponse } from "next/og"

export const alt = "MAYOWA — AI UGC videos, product imagery and websites for brands"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#080808", color: "white", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", fontSize: 36, color: "#ff3535", letterSpacing: 6 }}>MAYOWA</div>
      <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>Content that makes your brand move.</div>
      <div style={{ display: "flex", fontSize: 28, color: "#cccccc" }}>AI UGC videos · Product imagery · Brand websites</div>
    </div>,
    size,
  )
}
