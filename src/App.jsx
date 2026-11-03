import { Deck } from '@revealjs/react';
import RevealHighlight from 'reveal.js/plugin/highlight';
import 'reveal.js/reveal.css';
import 'reveal.js/theme/black.css';
import 'reveal.js/plugin/highlight/monokai.css';
import './styles.css';

import IntroSlide from './slides/IntroSlide.jsx';
import SectionSlide from './slides/SectionSlide.jsx';
import { ShortestPathSlide, ProblemGraphSlide } from './slides/ProblemSlides.jsx';
import { DijkstraOverviewSlide, BfsSlide, GreedySlide } from './slides/AlgorithmSlides.jsx';
import { DijkstraExplainSlide, CodeCompareSlide } from './slides/HowItWorksSlides.jsx';
import DijkstraSlide from './slides/DijkstraSlide.jsx';
import AStarSlide from './slides/AStarSlide.jsx';
import AStarRaceSlide from './slides/AStarRaceSlide.jsx';
import { TimeComplexitySlide, SpaceComplexitySlide } from './slides/ComplexitySlides.jsx';
import { CorrectnessSlide, AdmissibleSlide, ConsistentSlide } from './slides/CorrectnessSlides.jsx';
import EndSlide from './slides/EndSlide.jsx';

export default function App() {
  return (
    <Deck
      config={{
        width: 1280,
        height: 720,
        hash: true,
        controls: true,
        progress: true,
        transition: 'slide',
      }}
      plugins={[RevealHighlight]}
    >
      <IntroSlide />

      <SectionSlide number={1} title="The Problem" />
      <ShortestPathSlide />
      <ProblemGraphSlide />

      <SectionSlide number={2} title="Associated Algorithms" />
      <DijkstraOverviewSlide />
      <BfsSlide />
      <GreedySlide />

      <SectionSlide number={3} title="How A* Works" />
      <DijkstraExplainSlide />
      <DijkstraSlide />
      <CodeCompareSlide />
      <AStarSlide />
      <AStarRaceSlide />

      <SectionSlide number={4} title="Time Complexity" />
      <TimeComplexitySlide />

      <SectionSlide number={5} title="Space Complexity" />
      <SpaceComplexitySlide />

      <SectionSlide number={6} title="Correctness" />
      <CorrectnessSlide />
      <AdmissibleSlide />
      <ConsistentSlide />

      <EndSlide />
    </Deck>
  );
}
