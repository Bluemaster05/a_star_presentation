import { Slide } from '@revealjs/react';

function AlgorithmSlide({ title, tag, priority, points, verdict, verdictClass }) {
  return (
    <Slide>
      <h3>{title}</h3>
      <div className="algo-tag">{tag}</div>
      <div className="priority">
        Picks next by: <code>{priority}</code>
      </div>
      <ul className="points">
        {points.map((p) => (
          <li key={p} className="fragment">
            {p}
          </li>
        ))}
      </ul>
      <p className={`fragment verdict ${verdictClass}`}>{verdict}</p>
    </Slide>
  );
}

export function DijkstraOverviewSlide() {
  return (
    <AlgorithmSlide
      title="Dijkstra&rsquo;s Algorithm"
      tag="The basis for A*"
      priority="g(n) — cost from the start"
      points={[
        'Always expands the cheapest unexplored vertex first',
        'Works on any graph with non-negative edge weights',
        'Guaranteed to find the shortest path',
        'Explores evenly in every direction, with no idea where the goal is',
      ]}
      verdict="Correct, but blind"
      verdictClass="ok"
    />
  );
}

export function BfsSlide() {
  return (
    <AlgorithmSlide
      title="Breadth-First Search"
      tag="Simple, but inefficient"
      priority="first in, first out (queue)"
      points={[
        'Explores level by level: every neighbor, then every neighbor’s neighbor…',
        'Finds the path with the fewest edges',
        'Ignores edge weights, so it is only shortest when every edge costs the same',
        'Visits huge numbers of vertices that lead nowhere near the goal',
      ]}
      verdict="Easy to write, wasteful to run"
      verdictClass="warn"
    />
  );
}

export function GreedySlide() {
  return (
    <AlgorithmSlide
      title="Greedy Best-First Search"
      tag="Uses a heuristic, like A*"
      priority="h(n) — estimated distance to the goal"
      points={[
        'Always moves toward whatever looks closest to the goal',
        'Very fast when the way forward is clear',
        'Ignores how much it has already paid to get there',
        'Can be lured down a long detour: not guaranteed to be the shortest path',
      ]}
      verdict="Fast, but can be wrong"
      verdictClass="bad"
    />
  );
}
