import type React from 'react'
import type { MarqueeState } from '../hooks/useMarquee'
import './Marquee.scss'

export const MarqueeBox: React.FC<{ marquee: MarqueeState }> = ({ marquee }) => {
  if (!marquee.active || marquee.width < 2 || marquee.height < 2) return null

  return (
    <div
      className="media-gallery-marquee"
      style={{
        left: marquee.x,
        top: marquee.y,
        width: marquee.width,
        height: marquee.height,
      }}
    />
  )
}
