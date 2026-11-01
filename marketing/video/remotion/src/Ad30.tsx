import React from 'react'
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion'
import { TitleCard } from './TitleCard'
import { COLORS, PRODUCT, URL } from './theme'

export const Ad30: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
    <Sequence durationInFrames={45}>
      <TitleCard title="Spreadsheets out." subtitle="One home in." />
    </Sequence>
    <Sequence from={45} durationInFrames={180}>
      <OffthreadVideo src={staticFile('raw/02-officer-home.mp4')} />
    </Sequence>
    <Sequence from={225} durationInFrames={180}>
      <OffthreadVideo src={staticFile('raw/06-recruitment.mp4')} />
    </Sequence>
    <Sequence from={405} durationInFrames={90}>
      <TitleCard title="Try the demo" subtitle={URL} eyebrow={PRODUCT} />
    </Sequence>
  </AbsoluteFill>
)
