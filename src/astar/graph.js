// Example graph for the A* walkthrough. Vertices sit on an x/y plane and every
// edge weight is the straight-line (Euclidean) length between its endpoints,
// which is what makes straight-line distance a safe heuristic here.
export const vertices = [
  { id: 'S', x: 1, y: 3 },
  { id: 'A', x: 3, y: 6 },
  { id: 'B', x: 4, y: 2 },
  { id: 'C', x: 0, y: 5 },
  { id: 'D', x: 6, y: 5 },
  { id: 'E', x: 7, y: 1 },
  { id: 'F', x: 2, y: 0 },
  { id: 'G', x: 9, y: 3 },
];

const pairs = [
  ['S', 'A'],
  ['S', 'B'],
  ['S', 'C'],
  ['S', 'F'],
  ['A', 'C'],
  ['A', 'D'],
  ['B', 'D'],
  ['B', 'E'],
  ['B', 'F'],
  ['D', 'G'],
  ['E', 'G'],
];

export const START = 'S';
export const GOAL = 'G';

export const byId = Object.fromEntries(vertices.map((v) => [v.id, v]));

// Straight-line distance, rounded to one decimal so the numbers on the slide
// add up exactly as displayed.
export const distance = (a, b) =>
  Math.round(Math.hypot(byId[a].x - byId[b].x, byId[a].y - byId[b].y) * 10) / 10;

export const edges = pairs.map(([from, to]) => ({ from, to, weight: distance(from, to) }));
