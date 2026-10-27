// Example graph for the Dijkstra walkthrough. Undirected, weighted.
// Positions are in SVG units (viewBox 0 0 600 420).
export const vertices = [
  { id: 'A', x: 60, y: 210 },
  { id: 'B', x: 210, y: 70 },
  { id: 'C', x: 210, y: 350 },
  { id: 'D', x: 390, y: 70 },
  { id: 'E', x: 390, y: 350 },
  { id: 'F', x: 540, y: 210 },
];

export const edges = [
  { from: 'A', to: 'B', weight: 4 },
  { from: 'A', to: 'C', weight: 2 },
  { from: 'B', to: 'C', weight: 1 },
  { from: 'B', to: 'D', weight: 5 },
  { from: 'C', to: 'D', weight: 8 },
  { from: 'C', to: 'E', weight: 10 },
  { from: 'D', to: 'E', weight: 2 },
  { from: 'D', to: 'F', weight: 6 },
  { from: 'E', to: 'F', weight: 2 },
];

export const START = 'A';
