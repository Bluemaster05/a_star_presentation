import { useEffect, useState } from 'react';
import { useReveal } from '@revealjs/react';

// Each Reveal fragment on a slide advances it by one step.
// Counting the visible fragments keeps us in sync with forward/back navigation.
// `markerRef` can point at any element inside the slide's <section>.
export function useFragmentStep(markerRef) {
  const deck = useReveal();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!deck) return;
    const update = () => {
      const section = markerRef.current?.closest('section');
      if (section) setStep(section.querySelectorAll('.fragment.visible').length);
    };
    const events = ['ready', 'slidechanged', 'fragmentshown', 'fragmenthidden'];
    events.forEach((e) => deck.on(e, update));
    update();
    return () => events.forEach((e) => deck.off(e, update));
  }, [deck, markerRef]);

  return step;
}
