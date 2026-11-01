import React from 'react'
import { Composition } from 'remotion'
import { Walkthrough } from './Walkthrough'
import { Ad30 } from './Ad30'
import { Ad15Vertical } from './Ad15Vertical'

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Walkthrough"
      component={Walkthrough}
      durationInFrames={750}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition id="Ad30" component={Ad30} durationInFrames={495} fps={30} width={1920} height={1080} />
    <Composition
      id="Ad15Vertical"
      component={Ad15Vertical}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
)
