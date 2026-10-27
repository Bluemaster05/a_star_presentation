import { useRef } from 'react';
import { Slide } from '@revealjs/react';
import { useFragmentStep } from '../hooks/useFragmentStep.js';
import { vertices, edges, START } from '../dijkstra/graph.js';
import { buildSteps, edgeKey } from '../dijkstra/steps.js';

const steps = buildSteps(vertices, edges, START);
const byId = Object.fromEntries(vertices.map((v) => [v.id, v]));

function Graph({ state }) {
  const { rows, current, relaxing } = state;
  const treeEdges = new Set(
    Object.entries(rows)
      .filter(([, r]) => r.path)
      .map(([v, r]) => edgeKey(v, r.path))
  );

  return (
    <svg className="graph" viewBox="0 0 600 420">
      {edges.map(({ from, to, weight }) => {
        const a = byId[from];
        const b = byId[to];
        const key = edgeKey(from, to);
        const cls = ['edge', treeEdges.has(key) && 'tree', relaxing.includes(key) && 'relaxing']
          .filter(Boolean)
          .join(' ');
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return (
          <g key={key} className={cls}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            <circle className="weight-bg" cx={mx} cy={my} r={17} />
            <text className="weight" x={mx} y={my}>
              {weight}
            </text>
          </g>
        );
      })}
      {vertices.map(({ id, x, y }) => {
        const cls = ['vertex', rows[id].known && 'known', current === id && 'current']
          .filter(Boolean)
          .join(' ');
        return (
          <g key={id} className={cls}>
            <circle cx={x} cy={y} r={28} />
            <text x={x} y={y}>
              {id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Table({ state, prev, step }) {
  const { rows, current, updated } = state;
  return (
    <table className="dijkstra-table">
      <thead>
        <tr>
          <th>Vertex</th>
          <th>Known</th>
          <th>Cost</th>
          <th>Path</th>
        </tr>
      </thead>
      <tbody>
        {vertices.map(({ id }) => {
          const row = rows[id];
          const changed = updated.includes(id);
          const justKnown = row.known && !prev.rows[id].known;
          return (
            <tr key={id} className={current === id ? 'current' : ''}>
              <td>{id}</td>
              <td key={`k-${step}`} className={[row.known ? 'yes' : 'no', justKnown && 'flash'].filter(Boolean).join(' ')}>
                {row.known ? 'T' : 'F'}
              </td>
              <td key={`c-${step}`} className={changed ? 'flash' : ''}>
                {row.cost === Infinity ? '∞' : row.cost}
              </td>
              <td key={`p-${step}`} className={changed ? 'flash' : ''}>
                {row.path ?? '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function DijkstraSlide() {
  const markerRef = useRef(null);
  const step = useFragmentStep(markerRef);
  const state = steps[Math.min(step, steps.length - 1)];
  const prev = steps[Math.max(step - 1, 0)];

  return (
    <Slide>
      <h3 ref={markerRef}>Dijkstra&rsquo;s Algorithm</h3>
      <div className="dijkstra">
        <Graph state={state} />
        <Table state={state} prev={prev} step={step} />
      </div>
      <p className="caption">{state.message}</p>
      <div className="step-counter">
        Step {step} / {steps.length - 1}
      </div>
      {steps.slice(1).map((_, i) => (
        <span key={i} className="fragment step-marker" />
      ))}
    </Slide>
  );
}
