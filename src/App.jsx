import { Deck } from '@revealjs/react';
import 'reveal.js/reveal.css';
import 'reveal.js/theme/black.css';
import './styles.css';

import IntroSlide from './slides/IntroSlide.jsx';
import DijkstraSlide from './slides/DijkstraSlide.jsx';
import AStarRaceSlide from './slides/AStarRaceSlide.jsx';
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
    >
      <IntroSlide />
      <DijkstraSlide />
      <AStarRaceSlide />
      <EndSlide />
    </Deck>
  );
}
