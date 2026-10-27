// Grid used for the Dijkstra vs A* race. 4-connected, every move costs 1.
export const COLS = 25;
export const ROWS = 17;
export const START = { x: 2, y: 13 };
export const GOAL = { x: 22, y: 3 };

// A wall hanging from the top edge, so the path has to duck underneath it.
export const walls = new Set();
for (let y = 0; y <= 9; y++) walls.add(`${12},${y}`);

const key = (x, y) => `${x},${y}`;

// Heuristics: estimated distance from cell `c` to the goal.
export const heuristics = {
  none: () => 0,
  euclidean: (c) => Math.hypot(c.x - GOAL.x, c.y - GOAL.y),
  manhattan: (c) => Math.abs(c.x - GOAL.x) + Math.abs(c.y - GOAL.y),
};

// Runs a best-first search and records *when* each cell happened, measured in
// expansions, so the slide can replay the search at any point in time.
//   openedAt[key]: expansion count when the cell was first added to the frontier
//   closedAt[key]: expansion count when the cell was expanded (marked known)
//   path:          cells on the final path, start → goal
//   expansions:    total cells expanded before reaching the goal
//
// heuristics.none → Dijkstra (priority = g)
// anything else   → A*       (priority = g + h, ties broken on smaller h)
export function search(h) {
  const g = { [key(START.x, START.y)]: 0 };
  const prev = {};
  const openedAt = { [key(START.x, START.y)]: 0 };
  const closedAt = {};
  let open = [{ ...START, order: 0 }];
  let order = 1;
  let expansions = 0;

  while (open.length) {
    // Pick the frontier cell with the lowest priority (a simple scan is plenty here).
    let best = 0;
    for (let i = 1; i < open.length; i++) {
      const a = open[i];
      const b = open[best];
      const fa = g[key(a.x, a.y)] + h(a);
      const fb = g[key(b.x, b.y)] + h(b);
      if (fa < fb || (fa === fb && (h(a) < h(b) || (h(a) === h(b) && a.order < b.order)))) {
        best = i;
      }
    }
    const cur = open[best];
    open.splice(best, 1);
    const ck = key(cur.x, cur.y);
    if (ck in closedAt) continue;
    closedAt[ck] = ++expansions;
    if (cur.x === GOAL.x && cur.y === GOAL.y) break;

    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const nk = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || walls.has(nk) || nk in closedAt) continue;
      const cost = g[ck] + 1;
      if (!(nk in g) || cost < g[nk]) {
        g[nk] = cost;
        prev[nk] = ck;
        if (!(nk in openedAt)) openedAt[nk] = expansions;
        open.push({ x: nx, y: ny, order: order++ });
      }
    }
  }

  const path = [];
  for (let k = key(GOAL.x, GOAL.y); k; k = prev[k]) path.unshift(k);
  return { openedAt, closedAt, path: new Set(path), pathLength: path.length - 1, expansions };
}
