import { useRef } from 'react';
import { Slide } from '@revealjs/react';
import { useFragmentStep } from '../hooks/useFragmentStep.js';
import { scenarios, runName, ALGORITHMS, SHORT_NAMES } from '../results/data.js';
import Schematic from '../results/Schematic.jsx';

// Fixed color per algorithm (categorical order), so an algorithm keeps its color on every slide.
const COLORS = Object.fromEntries(
  ALGORITHMS.map((a, i) => [a, ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300'][i]])
);
const HEURISTIC_ALGOS = ALGORITHMS.slice(2);
const BASELINE = 'Dijkstra (stop at goal)';

const fmt = (v, digits = 0) =>
  v == null ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
const fmtMs = (v) => (v == null ? '—' : fmt(v, v < 10 ? 2 : v < 100 ? 1 : 0));
const sizeLabel = (s) =>
  s.nodes === Infinity ? 'infinite graph' : `${fmt(s.nodes)} nodes · ${fmt(s.edges)} edges`;

function GroupTag({ group }) {
  return <span className={`group-tag ${group}`}>{group === 'good' ? 'good case' : group === 'bad' ? 'bad case' : group}</span>;
}

// ---------- Overview ----------

export function ResultsOverviewSlide() {
  if (!scenarios.length) {
    return (
      <Slide>
        <h3>Results</h3>
        <p>
          No benchmark data yet. Run <code>python demo/benchmark.py</code>.
        </p>
      </Slide>
    );
  }
  return (
    <Slide>
      <h3>Every Graph at a Glance</h3>
      <table className="results-overview">
        <thead>
          <tr>
            <th>Graph</th>
            {HEURISTIC_ALGOS.map((a) => (
              <th key={a}>
                <i className="algo-swatch" style={{ background: COLORS[a] }} />
                {SHORT_NAMES[a]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => {
            const byAlgo = Object.fromEntries(s.rows.map((r) => [r.algorithm, r]));
            return (
              <tr key={s.name}>
                <td className="scenario-cell">
                  {s.name} <GroupTag group={s.group} />
                </td>
                {HEURISTIC_ALGOS.map((a) => {
                  const r = byAlgo[a];
                  if (!r || r.pctExplored == null) return <td key={a}>—</td>;
                  const alpha = 0.1 + 0.7 * Math.min(r.pctExplored, 100) / 100;
                  const over = (r.costVsOptimal - 1) * 100;
                  const extra = over > 0.05 ? `+${over.toFixed(over < 1 ? 1 : 0)}% cost` : null;
                  return (
                    <td
                      key={a}
                      className="heat"
                      style={{ background: `rgba(57, 135, 229, ${alpha})` }}
                      title={`${a}: explored ${fmt(r.explored)} nodes (${r.pctExplored}% of Dijkstra), ${r.speedup}x faster`}
                    >
                      <strong>{fmt(r.pctExplored, r.pctExplored < 10 ? 1 : 0)}%</strong>
                      <span className="heat-speed"> · {fmt(r.speedup, 1)}×</span>
                      {extra && <span className="heat-cost">{extra}</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="results-note">
        % of Dijkstra&rsquo;s nodes explored (darker = more work) · × = speedup over Dijkstra stopping at the goal ·{' '}
        <span className="heat-cost">+cost</span> = path longer than the shortest · source: {runName}
      </p>
    </Slide>
  );
}

// ---------- One slide per graph ----------

function BarChart({ scenario, metric, format, unit }) {
  const byAlgo = Object.fromEntries(scenario.rows.map((r) => [r.algorithm, r]));
  const max = Math.max(...scenario.rows.map((r) => r[metric] ?? 0));
  return (
    <div className="bar-chart">
      {ALGORITHMS.map((a) => {
        const r = byAlgo[a];
        const value = r?.[metric];
        return (
          <div key={a} className="bar-row" title={r ? `${a}: ${format(value)} ${unit}` : `${a}: skipped`}>
            <span className="bar-label">{SHORT_NAMES[a]}</span>
            <span className="bar-track">
              {r ? (
                <span
                  className="bar"
                  style={{ width: `max(3px, ${(100 * (value ?? 0)) / (max || 1)}%)`, background: COLORS[a] }}
                />
              ) : (
                <span className="bar-skipped">skipped: can&rsquo;t finish an infinite graph</span>
              )}
            </span>
            <span className="bar-value">{r ? format(value) : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

function resultBadge(result) {
  if (result === 'shortest') return <span className="status good">✓ shortest</span>;
  if (result === 'longer than shortest') return <span className="status warn">▲ longer</span>;
  if (result.startsWith('BUG')) return <span className="status bad">✕ {result}</span>;
  return <span className="status muted">{result}</span>;
}

function ResultsTable({ scenario }) {
  return (
    <table className="results-table">
      <thead>
        <tr>
          <th>Algorithm</th>
          <th>Time ms</th>
          <th>Speedup</th>
          <th>Explored</th>
          <th>Max frontier</th>
          <th>Path cost</th>
          <th>vs shortest</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {scenario.rows.map((r) => (
          <tr key={r.algorithm}>
            <td>
              <i className="algo-swatch" style={{ background: COLORS[r.algorithm] }} />
              {SHORT_NAMES[r.algorithm]}
            </td>
            <td>{fmtMs(r.timeMs)}</td>
            <td>{r.speedup == null ? '—' : `${fmt(r.speedup, 1)}×`}</td>
            <td>{fmt(r.explored)}</td>
            <td>{fmt(r.maxFrontier)}</td>
            <td>{fmt(r.pathCost, 1)}</td>
            <td>{r.costVsOptimal == null ? '—' : `${fmt(r.costVsOptimal * 100, 1)}%`}</td>
            <td>{resultBadge(r.result)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const VIEWS = ['Nodes explored', 'Time (ms)', 'Table'];

function ScenarioSlide({ scenario }) {
  const markerRef = useRef(null);
  const step = useFragmentStep(markerRef);
  const base = scenario.rows.find((r) => r.algorithm === BASELINE);

  return (
    <Slide>
      <h3 ref={markerRef} className="scenario-title">
        {scenario.name}
      </h3>
      <p className="scenario-meta">
        <GroupTag group={scenario.group} /> {sizeLabel(scenario)}
        {base && <> · Dijkstra explored {fmt(base.explored)} nodes</>}
      </p>
      <div className="scenario">
        <Schematic scenario={scenario} />
        <div className="scenario-data">
          <div className="view-tabs">
            {VIEWS.map((v, i) => (
              <span key={v} className={i === step ? 'active' : ''}>
                {v}
              </span>
            ))}
          </div>
          <div className="views">
            <div className={`view ${step === 0 ? 'shown' : ''}`}>
              <BarChart scenario={scenario} metric="explored" unit="nodes" format={(v) => fmt(v)} />
            </div>
            <div className={`view ${step === 1 ? 'shown' : ''}`}>
              <BarChart scenario={scenario} metric="timeMs" unit="ms" format={fmtMs} />
            </div>
            <div className={`view ${step === 2 ? 'shown' : ''}`}>
              <ResultsTable scenario={scenario} />
            </div>
          </div>
        </div>
      </div>
      <span className="fragment step-marker" />
      <span className="fragment step-marker" />
    </Slide>
  );
}

export function ScenarioSlides() {
  return scenarios.map((s) => <ScenarioSlide key={s.name} scenario={s} />);
}
