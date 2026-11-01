import React from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { COLORS, FONTS, PRODUCT } from './theme'

export const TitleCard: React.FC<{
  eyebrow?: string
  title: string
  subtitle?: string
}> = ({ eyebrow = PRODUCT, title, subtitle }) => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' })
  const y = interpolate(frame, [0, 12], [16, 0], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.ink,
        color: COLORS.white,
        fontFamily: FONTS.serif,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: COLORS.gold,
        }}
      />
      <p
        style={{
          fontFamily: FONTS.mono,
          fontSize: 14,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: COLORS.gold,
          marginBottom: 18,
        }}
      >
        {eyebrow}
      </p>
      <h1 style={{ fontSize: 64, margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
      {subtitle ? (
        <p style={{ fontFamily: FONTS.sans, fontSize: 22, opacity: 0.75, marginTop: 16 }}>
          {subtitle}
        </p>
      ) : null}
    </AbsoluteFill>
  )
}
