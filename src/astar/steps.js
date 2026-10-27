// Records a snapshot of the table after every visual step, mirroring
// dijkstra/steps.js. Pass a heuristic for A*, or null for plain Dijkstra on
// the same graph (priority is just g, and h is never computed).
//
// Each snapshot:
//   rows:       { [vertex]: { known, g, h, path } }   (f is g + h)
//   current:    vertex being expanded (or null)
//   relaxing:   edge keys being examined this step
//   updated:    vertices whose g/h/path changed this step
//   heuristics: vertices to draw a straight line to the goal from
//   finalPath:  vertices on the winning path (last step only)
//   message:    caption shown under the slide

import { edgeKey } from '../dijkstra/steps.js';

// Work in tenths so 3.2 + 3.6 is exactly 6.8.
const tenths = (n) => Math.round(n * 10);
export const fmt = (n) => (n === Infinity ? '∞' : (n / 10).toFixed(1));

function neighbors(edges, v) {
  return edges
    .filter((e) => e.from === v || e.to === v)
    .map((e) => ({ v: e.from === v ? e.to : e.from, weight: tenths(e.weight) }));
}

export function buildSteps(vertices, edges, start, goal, heuristic) {
  const isAStar = heuristic !== null;
  const pos = Object.fromEntries(vertices.map((v) => [v.id, v]));
  const h = (id) => (isAStar ? tenths(heuristic(id, goal)) : 0);
  const hWork = (id) => {
    const dx = Math.abs(pos[id].x - pos[goal].x);
    const dy = Math.abs(pos[id].y - pos[goal].y);
    return `√(${dx}² + ${dy}²) = ${fmt(h(id))}`;
  };

  const rows = Object.fromEntries(
    vertices.map(({ id }) => [id, { known: false, g: Infinity, h: null, path: null }])
  );
  rows[start].g = 0;
  rows[start].h = h(start);

  const steps = [];
  const snapshot = (extra) =>
    steps.push({
      rows: structuredClone(rows),
      current: null,
      relaxing: [],
      updated: [],
      heuristics: [],
      finalPath: [],
      ...extra,
    });

  snapshot({
    updated: [start],
    heuristics: isAStar ? [start] : [],
    message: isAStar
      ? `Start at ${start}: g = 0. Estimate the rest with a straight line to ${goal}: h = ${hWork(start)}.`
      : `Dijkstra first: start at ${start} with cost 0, and head for ${goal}.`,
  });

  const f = (id) => rows[id].g + rows[id].h;

  for (;;) {
    const open = vertices.map((v) => v.id).filter((id) => !rows[id].known && rows[id].g < Infinity);
    if (open.length === 0) break;
    const v = open.reduce((best, id) => (f(id) < f(best) ? id : best));

    // Step 1: expand the open vertex with the lowest priority.
    rows[v].known = true;
    const others = open.filter((id) => id !== v);
    const reason = isAStar
      ? `${v} has the lowest f = g + h (${fmt(rows[v].g)} + ${fmt(rows[v].h)} = ${fmt(f(v))}). `
      : `${v} has the lowest cost (${fmt(rows[v].g)}). `;
    snapshot({
      current: v,
      heuristics: isAStar ? open : [],
      message:
        reason +
        (v === goal ? `It's the goal, so we stop here!` : 'Mark it known.') +
        (isAStar && others.length
          ? `\nOthers waiting: ${others.map((id) => `${id} f = ${fmt(f(id))}`).join(',  ')}`
          : ''),
    });

    if (v === goal) break;

    // Step 2: relax every edge to an unknown neighbor, computing h the first time we see it.
    const relaxing = [];
    const updated = [];
    const notes = [];
    for (const { v: w, weight } of neighbors(edges, v)) {
      if (rows[w].known) continue;
      relaxing.push(edgeKey(v, w));
      const firstSeen = rows[w].h === null;
      if (firstSeen) rows[w].h = h(w);
      const candidate = rows[v].g + weight;
      const sum = `${fmt(rows[v].g)} + ${fmt(weight)} = ${fmt(candidate)}`;
      if (candidate < rows[w].g) {
        rows[w].g = candidate;
        rows[w].path = v;
        updated.push(w);
        notes.push(
          isAStar
            ? `${w}: g = ${sum}` + (firstSeen ? `, h = ${hWork(w)}` : '') + `, f = ${fmt(f(w))}`
            : `${w}: ${sum}`
        );
      } else {
        notes.push(`${w}: ${sum} ≥ ${fmt(rows[w].g)}, no change`);
      }
    }
    snapshot({
      current: v,
      relaxing,
      updated,
      heuristics: isAStar ? relaxing.map((k) => k.split('-').find((id) => id !== v)) : [],
      message: relaxing.length === 0 ? `${v} has no unknown neighbors.` : notes.join('\n'),
    });
  }

  const finalPath = [];
  for (let v = goal; v; v = rows[v].path) finalPath.unshift(v);
  const expanded = Object.values(rows).filter((r) => r.known).length;
  const summary = `Shortest path ${finalPath.join(' → ')} (cost ${fmt(rows[goal].g)}).`;
  if (isAStar) {
    const dijkstraExpanded = buildSteps(vertices, edges, start, goal, null).expanded;
    snapshot({
      finalPath,
      message: `${summary} A* expanded ${expanded} of ${vertices.length} vertices — Dijkstra expanded ${dijkstraExpanded}.`,
    });
  } else {
    snapshot({
      finalPath,
      message: `${summary} Dijkstra expanded ${expanded} of ${vertices.length} vertices to get there.`,
    });
  }

  steps.expanded = expanded;
  return steps;
}
