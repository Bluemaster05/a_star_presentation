import { Slide } from '@revealjs/react';

export function DijkstraExplainSlide() {
  return (
    <Slide>
      <h3>Dijkstra&rsquo;s, Step by Step</h3>
      <ol className="points">
        <li className="fragment">Set the start&rsquo;s cost to 0 and every other vertex to ∞</li>
        <li className="fragment">Pick the unknown vertex with the lowest cost and mark it known</li>
        <li className="fragment">
          <span className="hl">Relax</span> its edges: if going through it is cheaper, update the neighbor&rsquo;s cost
          and path
        </li>
        <li className="fragment">Repeat until every vertex is known</li>
      </ol>
      <p className="fragment muted">A priority queue (min-heap) makes &ldquo;pick the lowest cost&rdquo; fast.</p>
    </Slide>
  );
}

const DIJKSTRA = `def dijkstra(graph, start):
    dist = {start: 0}
    pq = [(0, start)]

    while pq:
        cost, u = heapq.heappop(pq)

        if cost > dist[u]:
            continue

        for v, weight in graph[u]:
            new_cost = cost + weight

            if new_cost < dist.get(v, float("inf")):
                dist[v] = new_cost
                heapq.heappush(pq, (new_cost, v))

    return dist`;

const A_STAR = `def a_star(graph, start, goal, h):
    g_score = {start: 0}
    pq = [(h(start), start)]

    while pq:
        _, u = heapq.heappop(pq)

        if u == goal:
            return g_score[u]

        for v, weight in graph[u]:
            new_cost = g_score[u] + weight

            if new_cost < g_score.get(v, float("inf")):
                g_score[v] = new_cost
                heapq.heappush(pq, (new_cost + h(v), v))

    return float("inf")`;

// Both code blocks step through these together; the captions line up index for index.
const STEPS = [
  { lines: '1-3', caption: 'Setup: cost 0 for the start, push it onto a priority queue.' },
  { lines: '5-6', caption: 'Same loop: pop whatever has the lowest priority.' },
  { lines: '11-16', caption: 'Same relaxation: a cheaper route to a neighbor updates it and pushes it.' },
  { lines: '1,3,16', caption: 'Difference #1: A* adds the heuristic h to the priority: f = g + h.', diff: true },
  { lines: '1,8-9', caption: 'Difference #2: A* knows its goal and stops the moment it pops it.', diff: true },
];
const lineNumbers = `|${STEPS.map((s) => s.lines).join('|')}`;

// Rendered by hand (not <Code>) so data-fragment-index is present when the highlight
// plugin splits the steps; that makes both blocks share fragment indices and move together.
function PythonCode({ code }) {
  return (
    <pre>
      <code className="python" data-trim data-line-numbers={lineNumbers} data-fragment-index={0}>
        {code}
      </code>
    </pre>
  );
}

export function CodeCompareSlide() {
  return (
    <Slide>
      <h3>Dijkstra vs A*: The Code</h3>
      <div className="code-compare">
        <div>
          <div className="code-title">Dijkstra</div>
          <PythonCode code={DIJKSTRA} />
        </div>
        <div>
          <div className="code-title astar">A*</div>
          <PythonCode code={A_STAR} />
        </div>
      </div>
      <div className="code-captions">
        <p className="fragment fade-out" data-fragment-index={0}>
          Same shape, line for line. Watch what changes.
        </p>
        {STEPS.map((s, i) => (
          <p
            key={s.lines}
            className={`fragment ${i < STEPS.length - 1 ? 'current-visible' : ''} ${s.diff ? 'diff' : ''}`}
            data-fragment-index={i}
          >
            {s.caption}
          </p>
        ))}
      </div>
    </Slide>
  );
}
