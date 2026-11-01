import React from 'react'
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion'
import { TitleCard } from './TitleCard'
import { COLORS, PRODUCT, URL } from './theme'

/**
 * Remotion timeline wrappers around captured clips.
 * Clips are expected under public/raw after capture copies them.
 */
const CLIP = (name: string) => staticFile(`raw/${name}.mp4`)

export const Walkthrough: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <Sequence durationInFrames={90}>
        <TitleCard title="Your chapter, one place." subtitle={PRODUCT} />
      </Sequence>
      <Sequence from={90} durationInFrames={150}>
        <AbsoluteFill>
          <OffthreadVideo src={CLIP('02-officer-home')} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={240} durationInFrames={120}>
        <AbsoluteFill>
          <OffthreadVideo src={CLIP('03-calendar')} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={360} durationInFrames={120}>
        <AbsoluteFill>
          <OffthreadVideo src={CLIP('05-dues')} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={480} durationInFrames={150}>
        <AbsoluteFill>
          <OffthreadVideo src={CLIP('06-recruitment')} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={630} durationInFrames={120}>
        <TitleCard title="Try the demo" subtitle={URL} eyebrow={PRODUCT} />
      </Sequence>
    </AbsoluteFill>
  )
}
