import { useEffect, useRef, useState } from 'react';
import { Slide } from '@revealjs/react';
import { useFragmentStep } from '../hooks/useFragmentStep.js';
import { COLS, ROWS, START, GOAL, walls, search, heuristics } from '../astar/grid.js';

const runs = [
  { title: 'Dijkstra', formula: 'h = 0', result: search(heuristics.none) },
  { title: 'A* · Euclidean', formula: 'h = √(Δx² + Δy²)', result: search(heuristics.euclidean) },
  { title: 'A* · Manhattan', formula: 'h = |Δx| + |Δy|', result: search(heuristics.manhattan) },
];
const END = Math.max(...runs.map((r) => r.result.expansions));
const EXPANSIONS_PER_SECOND = 90;

const cells = [];
for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) cells.push({ x, y, k: `${x},${y}` });

// Plays the search clock from 0 → END whenever `playing` turns on (or `runId` changes).
function useSearchClock(playing, runId) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) {
      setT(0);
      return;
    }
    let frame;
    const begin = performance.now();
    const tick = (now) => {
      const next = Math.min(END, ((now - begin) / 1000) * EXPANSIONS_PER_SECOND);
      setT(next);
      if (next < END) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, runId]);
  return t;
}

function Grid({ title, formula, result, t }) {
  const done = t >= result.expansions;
  const explored = Math.min(Math.floor(t), result.expansions);

  const cellClass = ({ x, y, k }) => {
    if (x === START.x && y === START.y) return 'start';
    if (x === GOAL.x && y === GOAL.y) return 'goal';
    if (walls.has(k)) return 'wall';
    if (done && result.path.has(k)) return 'path';
    if (result.closedAt[k] <= t) return 'closed';
    if (result.openedAt[k] <= t) return 'open';
    return '';
  };

  return (
    <div className="race-panel">
      <h4>{title}</h4>
      <p className="race-formula">{formula}</p>
      <div className="race-grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {cells.map((c) => (
          <div key={c.k} className={`cell ${cellClass(c)}`} />
        ))}
      </div>
      <p className="race-stats">
        Cells explored: <strong>{explored}</strong>
        {done && <span className="race-done"> · path length {result.pathLength}</span>}
      </p>
    </div>
  );
}

export default function AStarRaceSlide() {
  const markerRef = useRef(null);
  const step = useFragmentStep(markerRef);
  const [runId, setRunId] = useState(0);
  const t = useSearchClock(step >= 1, runId);

  return (
    <Slide>
      <h3 ref={markerRef}>The Heuristic Matters</h3>
      <div className="race" onClick={() => setRunId((r) => r + 1)} title="Click to replay">
        {runs.map((run) => (
          <Grid key={run.title} {...run} t={t} />
        ))}
      </div>
      <div className="race-legend">
        <span><i className="cell start" /> start</span>
        <span><i className="cell goal" /> goal</span>
        <span><i className="cell open" /> frontier</span>
        <span><i className="cell closed" /> explored</span>
        <span><i className="cell path" /> shortest path</span>
      </div>
      <span className="fragment step-marker" />
    </Slide>
  );
}
