import React from 'react'
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion'
import { TitleCard } from './TitleCard'
import { COLORS, URL } from './theme'

export const Ad15Vertical: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
    <Sequence durationInFrames={300}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 390, height: 844, overflow: 'hidden', borderRadius: 28, border: '2px solid #333' }}>
          <OffthreadVideo src={staticFile('raw/08-chapter-room-mobile.mp4')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </AbsoluteFill>
    </Sequence>
    <Sequence from={300} durationInFrames={150}>
      <TitleCard title="Try the demo" subtitle={URL} />
    </Sequence>
  </AbsoluteFill>
)
