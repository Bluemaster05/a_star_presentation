import { Slide } from '@revealjs/react';

export function CorrectnessSlide() {
  return (
    <Slide>
      <h3>Is A* Always Right?</h3>
      <p className="lead">
        It depends on the <span className="hl">heuristic</span>.
      </p>
      <div className="cols">
        <div className="card fragment">
          <div className="card-label">Admissible</div>
          <p className="card-note">Never overestimates the remaining cost</p>
        </div>
        <div className="card fragment">
          <div className="card-label">Consistent</div>
          <p className="card-note">Never drops by more than the edge it crosses</p>
        </div>
      </div>
      <p className="fragment takeaway">With both, A* is guaranteed to return the shortest path.</p>
    </Slide>
  );
}

export function AdmissibleSlide() {
  return (
    <Slide>
      <h3>Admissible</h3>
      <div className="formula">
        h(n) ≤ h*(n)
      </div>
      <p className="muted formula-key">h*(n) = the true cheapest cost from n to the goal</p>
      <ul className="points">
        <li className="fragment">The heuristic is optimistic: it never claims the goal is farther than it really is</li>
        <li className="fragment">
          Straight-line distance works: no road is shorter than a straight line
        </li>
        <li className="fragment">
          If h overestimates, A* can skip over the real shortest path because it looked too expensive
        </li>
        <li className="fragment">
          h = 0 is admissible too, and turns A* back into Dijkstra
        </li>
      </ul>
    </Slide>
  );
}

// Triangle n → n' → goal for the consistency inequality.
function TriangleDiagram() {
  const n = { x: 70, y: 200 };
  const m = { x: 240, y: 50 };
  const g = { x: 410, y: 200 };
  return (
    <svg className="triangle" viewBox="0 0 480 260">
      <line className="tri-edge" x1={n.x} y1={n.y} x2={m.x} y2={m.y} />
      <line className="tri-h" x1={m.x} y1={m.y} x2={g.x} y2={g.y} />
      <line className="tri-h" x1={n.x} y1={n.y} x2={g.x} y2={g.y} />
      <text className="tri-label edge-label" x={130} y={110}>c(n, n′)</text>
      <text className="tri-label h-label" x={360} y={110}>h(n′)</text>
      <text className="tri-label h-label" x={240} y={228}>h(n)</text>
      {[
        [n, 'n'],
        [m, 'n′'],
        [g, 'goal'],
      ].map(([p, label]) => (
        <g key={label} className={`tri-node ${label === 'goal' ? 'goal' : ''}`}>
          <circle cx={p.x} cy={p.y} r={label === 'goal' ? 30 : 24} />
          <text x={p.x} y={p.y}>
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function ConsistentSlide() {
  return (
    <Slide>
      <h3>Consistent</h3>
      <div className="consistent">
        <div>
          <div className="formula">h(n) ≤ c(n, n′) + h(n′)</div>
          <ul className="points small">
            <li className="fragment">A triangle inequality: going through a neighbor can&rsquo;t make the estimate shrink faster than the step costs</li>
            <li className="fragment">So f = g + h never decreases along a path</li>
            <li className="fragment">The first time A* pops a node, it already has the cheapest route to it, so no node is ever reopened</li>
            <li className="fragment">Every consistent heuristic is also admissible</li>
          </ul>
        </div>
        <TriangleDiagram />
      </div>
    </Slide>
  );
}
