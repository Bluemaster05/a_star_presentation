// Loads the benchmark CSVs written by demo/benchmark.py. Vite bundles every file in
// demo/results, and we show the newest "standard" run (or the newest run of any preset).
const files = import.meta.glob('../../demo/results/*.csv', { query: '?raw', import: 'default', eager: true });

// Minimal CSV parser: handles quoted fields with commas and doubled quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])));
}

const num = (v) => (v === '' || v == null ? null : Number(v));

function pickFile() {
  const names = Object.keys(files).sort(); // names end in a timestamp, so sort = oldest -> newest
  const standard = names.filter((n) => n.includes('benchmark_standard_'));
  return (standard.length ? standard : names).at(-1);
}

const file = pickFile();

// The full-graph Dijkstra is skipped on infinite graphs, so it has no CSV row there.
export const ALGORITHMS = [
  'Dijkstra (full graph)',
  'Dijkstra (stop at goal)',
  'A* (euclidean)',
  'A* (manhattan)',
  'Weighted A* (euclidean x2)',
  'Greedy best-first (euclidean)',
];

export const SHORT_NAMES = {
  'Dijkstra (full graph)': 'Dijkstra (full)',
  'Dijkstra (stop at goal)': 'Dijkstra (stop)',
  'A* (euclidean)': 'A* euclidean',
  'A* (manhattan)': 'A* manhattan',
  'Weighted A* (euclidean x2)': 'Weighted A* ×2',
  'Greedy best-first (euclidean)': 'Greedy',
};

export const runName = file ? file.split('/').at(-1) : null;

// [{ name, group, nodes, edges, rows: [{ algorithm, timeMs, explored, ... }] }] in run order.
export const scenarios = (() => {
  if (!file) return [];
  const byName = new Map();
  for (const r of parseCsv(files[file])) {
    if (!byName.has(r.scenario)) {
      byName.set(r.scenario, {
        name: r.scenario,
        group: r.group,
        nodes: r.nodes === 'inf' ? Infinity : num(r.nodes),
        edges: r.edges === 'inf' ? Infinity : num(r.edges),
        rows: [],
      });
    }
    byName.get(r.scenario).rows.push({
      algorithm: r.algorithm,
      heuristic: r.heuristic,
      timeMs: num(r.time_ms),
      speedup: num(r.speedup_vs_dijkstra),
      explored: num(r.nodes_explored),
      pctExplored: num(r.pct_of_dijkstra_explored),
      generated: num(r.nodes_generated),
      maxFrontier: num(r.max_frontier),
      pathCost: num(r.path_cost),
      costVsOptimal: num(r.cost_vs_optimal),
      pathEdges: num(r.path_edges),
      result: r.result,
    });
  }
  return [...byName.values()];
})();
