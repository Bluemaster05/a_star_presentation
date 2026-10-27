// Runs Dijkstra's algorithm and records a snapshot of the table after every
// visual step, so the slide can just index into the list.
//
// Each snapshot:
//   rows:     { [vertex]: { known, cost, path } }
//   current:  vertex being processed (or null)
//   relaxing: edge keys being examined this step
//   updated:  vertices whose cost/path changed this step
//   message:  caption shown under the slide

export const edgeKey = (a, b) => [a, b].sort().join('-');

function neighbors(edges, v) {
  return edges
    .filter((e) => e.from === v || e.to === v)
    .map((e) => ({ v: e.from === v ? e.to : e.from, weight: e.weight }));
}

export function buildSteps(vertices, edges, start) {
  const rows = Object.fromEntries(
    vertices.map(({ id }) => [id, { known: false, cost: Infinity, path: null }])
  );
  rows[start].cost = 0;

  const steps = [];
  const snapshot = (extra) =>
    steps.push({
      rows: structuredClone(rows),
      current: null,
      relaxing: [],
      updated: [],
      ...extra,
    });

  snapshot({
    updated: [start],
    message: `Start at ${start}: its cost is 0, every other vertex is ∞.`,
  });

  for (;;) {
    const unknown = vertices.map((v) => v.id).filter((id) => !rows[id].known);
    if (unknown.length === 0) break;
    const v = unknown.reduce((best, id) => (rows[id].cost < rows[best].cost ? id : best));
    if (rows[v].cost === Infinity) break;

    // Step 1: select the cheapest unknown vertex and mark it known.
    rows[v].known = true;
    snapshot({
      current: v,
      message: `${v} is the unknown vertex with the lowest cost (${rows[v].cost}). Mark it known.`,
    });

    // Step 2: relax every edge to an unknown neighbor.
    const relaxing = [];
    const updated = [];
    const notes = [];
    for (const { v: w, weight } of neighbors(edges, v)) {
      if (rows[w].known) continue;
      relaxing.push(edgeKey(v, w));
      const candidate = rows[v].cost + weight;
      if (candidate < rows[w].cost) {
        const old = rows[w].cost === Infinity ? '∞' : rows[w].cost;
        rows[w].cost = candidate;
        rows[w].path = v;
        updated.push(w);
        notes.push(`${w}: ${rows[v].cost} + ${weight} = ${candidate} < ${old} ✓`);
      } else {
        notes.push(`${w}: ${rows[v].cost} + ${weight} = ${candidate} ≥ ${rows[w].cost}`);
      }
    }
    snapshot({
      current: v,
      relaxing,
      updated,
      message:
        relaxing.length === 0
          ? `${v} has no unknown neighbors.`
          : `Check ${v}'s unknown neighbors — ${notes.join(',  ')}`,
    });
  }

  snapshot({
    message: 'Done! The highlighted edges form the shortest-path tree from ' + start + '.',
  });

  return steps;
}
