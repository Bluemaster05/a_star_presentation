import { Slide } from '@revealjs/react';

// Title card that opens each numbered section of the outline.
export default function SectionSlide({ number, title, subtitle }) {
  return (
    <Slide className="section-slide" transition="zoom">
      <div className="section-number">{String(number).padStart(2, '0')}</div>
      <h2>{title}</h2>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </Slide>
  );
}
