import { useEffect, useRef, useState } from 'react';
import { Slide } from '@revealjs/react';
import { useFragmentStep } from '../hooks/useFragmentStep.js';
import { vertices, edges, byId, START, GOAL, distance } from '../astar/graph.js';
import { buildSteps, fmt } from '../astar/steps.js';
import { edgeKey } from '../dijkstra/steps.js';

const dijkstraSteps = buildSteps(vertices, edges, START, GOAL, null);
const astarSteps = buildSteps(vertices, edges, START, GOAL, distance);

// Coordinate plane → SVG. y points up, like a math graph.
const X_MAX = 9;
const Y_MAX = 6;
const UNIT = 58;
const LEFT = 40;
const TOP = 24;
const sx = (x) => LEFT + x * UNIT;
const sy = (y) => TOP + (Y_MAX - y) * UNIT;
const range = (n) => Array.from({ length: n + 1 }, (_, i) => i);

function Plane() {
  return (
    <g className="plane">
      {range(X_MAX).map((x) => (
        <g key={`x${x}`}>
          <line x1={sx(x)} y1={sy(0)} x2={sx(x)} y2={sy(Y_MAX)} />
          <text className="tick" x={sx(x)} y={sy(0) + 22}>
            {x}
          </text>
        </g>
      ))}
      {range(Y_MAX).map((y) => (
        <g key={`y${y}`}>
          <line x1={sx(0)} y1={sy(y)} x2={sx(X_MAX)} y2={sy(y)} />
          <text className="tick" x={sx(0) - 20} y={sy(y)}>
            {y}
          </text>
        </g>
      ))}
    </g>
  );
}

function Graph({ state }) {
  const { rows, current, relaxing, heuristics, finalPath } = state;
  const pathEdges = finalPath.length
    ? new Set(finalPath.slice(1).map((v, i) => edgeKey(v, finalPath[i])))
    : new Set(
        Object.entries(rows)
          .filter(([, r]) => r.path)
          .map(([v, r]) => edgeKey(v, r.path))
      );
  const goal = byId[GOAL];

  return (
    <svg className="graph astar-graph" viewBox="0 0 600 420">
      <Plane />
      {edges.map(({ from, to, weight }) => {
        const a = byId[from];
        const b = byId[to];
        const key = edgeKey(from, to);
        const cls = ['edge', pathEdges.has(key) && 'tree', relaxing.includes(key) && 'relaxing']
          .filter(Boolean)
          .join(' ');
        const mx = sx((a.x + b.x) / 2);
        const my = sy((a.y + b.y) / 2);
        return (
          <g key={key} className={cls}>
            <line x1={sx(a.x)} y1={sy(a.y)} x2={sx(b.x)} y2={sy(b.y)} />
            <circle className="weight-bg" cx={mx} cy={my} r={15} />
            <text className="weight" x={mx} y={my}>
              {weight.toFixed(1)}
            </text>
          </g>
        );
      })}
      {heuristics
        .filter((id) => id !== GOAL)
        .map((id) => {
          const v = byId[id];
          // Label near the vertex end, since all of these lines converge on the goal.
          const t = 0.3;
          const mx = sx(v.x + (goal.x - v.x) * t);
          const my = sy(v.y + (goal.y - v.y) * t);
          return (
            <g key={`h-${id}`} className="heuristic">
              <line x1={sx(v.x)} y1={sy(v.y)} x2={sx(goal.x)} y2={sy(goal.y)} />
              <rect x={mx - 30} y={my - 12} width={60} height={24} rx={6} />
              <text x={mx} y={my}>
                h={fmt(rows[id].h)}
              </text>
            </g>
          );
        })}
      {vertices.map(({ id, x, y }) => {
        const row = rows[id];
        const cls = [
          'vertex',
          row.known && 'known',
          !row.known && row.g < Infinity && 'open',
          current === id && 'current',
          id === GOAL && 'goal',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <g key={id} className={cls}>
            <circle cx={sx(x)} cy={sy(y)} r={22} />
            <text x={sx(x)} y={sy(y)}>
              {id}
            </text>
            <text className="coord" x={sx(x)} y={sy(y) + (y === 0 ? -34 : 36)}>
              ({x},{y})
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// h and f collapse to zero width while Dijkstra runs, then slide open for A*.
function ExtraCell({ className, children }) {
  return (
    <td className={['extra', className].filter(Boolean).join(' ')}>
      <div className="extra-inner">{children}</div>
    </td>
  );
}

function Table({ state, prev, frame, expanded }) {
  const { rows, current, updated } = state;
  return (
    <table className={`dijkstra-table astar-table ${expanded ? 'expanded' : 'collapsed'}`}>
      <thead>
        <tr>
          <th>Vertex</th>
          <th>Known</th>
          <th>{expanded ? 'g' : 'Cost'}</th>
          <th className="extra">
            <div className="extra-inner">h</div>
          </th>
          <th className="extra">
            <div className="extra-inner">f</div>
          </th>
          <th>Path</th>
        </tr>
      </thead>
      <tbody>
        {vertices.map(({ id }) => {
          const row = rows[id];
          const changed = updated.includes(id);
          const justKnown = row.known && !prev.rows[id].known;
          const hasF = row.h !== null && row.g < Infinity;
          return (
            <tr key={id} className={current === id ? 'current' : ''}>
              <td>{id}</td>
              <td key={`k-${frame}`} className={[row.known ? 'yes' : 'no', justKnown && 'flash'].filter(Boolean).join(' ')}>
                {row.known ? 'T' : 'F'}
              </td>
              <td key={`g-${frame}`} className={changed ? 'flash' : ''}>
                {fmt(row.g)}
              </td>
              <ExtraCell key={`h-${frame}`} className={[row.h !== null && 'h', changed && prev.rows[id].h === null && 'flash'].filter(Boolean).join(' ')}>
                {row.h === null ? '—' : fmt(row.h)}
              </ExtraCell>
              <ExtraCell key={`f-${frame}`} className={[hasF && 'f', changed && 'flash'].filter(Boolean).join(' ')}>
                {hasF ? fmt(row.g + row.h) : '—'}
              </ExtraCell>
              <td key={`p-${frame}`} className={changed ? 'flash' : ''}>
                {row.path ?? '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Step 0 shows the graph; step 1 auto-plays all of Dijkstra; step 2 onward walks A*.
const DIJKSTRA_MS_PER_STEP = 800;

function useAutoPlay(playing, length) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
    if (!playing) return;
    const timer = setInterval(() => {
      setIndex((i) => {
        if (i + 1 >= length - 1) clearInterval(timer);
        return Math.min(i + 1, length - 1);
      });
    }, DIJKSTRA_MS_PER_STEP);
    return () => clearInterval(timer);
  }, [playing, length]);
  return index;
}

export default function AStarSlide() {
  const markerRef = useRef(null);
  const step = useFragmentStep(markerRef);
  const dijkstraIndex = useAutoPlay(step === 1, dijkstraSteps.length);

  const isAStar = step >= 2;
  const list = isAStar ? astarSteps : dijkstraSteps;
  const index = isAStar ? Math.min(step - 2, astarSteps.length - 1) : dijkstraIndex;
  const state = list[index];
  const prev = list[Math.max(index - 1, 0)];
  const frame = `${isAStar ? 'a' : 'd'}${index}`;

  return (
    <Slide>
      <h3 ref={markerRef}>A* Search</h3>
      <div className="dijkstra astar">
        <Graph state={state} />
        <div>
          <div className={`phase-tag ${isAStar ? 'astar' : ''}`}>
            {isAStar ? 'A*: priority f = g + h' : 'Dijkstra: priority = cost'}
          </div>
          <Table state={state} prev={prev} frame={frame} expanded={isAStar} />
          <p className={`astar-key ${isAStar ? '' : 'hidden'}`}>
            g = cost so far · <span className="h">h</span> = straight-line distance to {GOAL} ·{' '}
            <span className="f">f</span> = g + h
          </p>
        </div>
      </div>
      <p className="caption astar-caption">{state.message}</p>
      {isAStar && (
        <div className="step-counter">
          Step {index} / {astarSteps.length - 1}
        </div>
      )}
      {Array.from({ length: astarSteps.length + 1 }, (_, i) => (
        <span key={i} className="fragment step-marker" />
      ))}
    </Slide>
  );
}
