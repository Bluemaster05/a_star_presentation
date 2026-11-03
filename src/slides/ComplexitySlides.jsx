import { Slide } from '@revealjs/react';

export function TimeComplexitySlide() {
  return (
    <Slide>
      <h3>Time Complexity</h3>
      <div className="cols">
        <div className="card">
          <div className="card-label">Dijkstra</div>
          <div className="big-o">O(|E| log |V|)</div>
          <ul className="points small">
            <li className="fragment">The graph is finite and fully known</li>
            <li className="fragment">Every edge |E| gets relaxed once</li>
            <li className="fragment">Each heap push / pop costs log |V|</li>
          </ul>
        </div>
        <div className="card fragment">
          <div className="card-label astar">A*</div>
          <div className="big-o">O(b<sup>d</sup>)</div>
          <ul className="points small">
            <li className="fragment">
              <span className="hl">b</span> = branching factor (neighbors per node)
            </li>
            <li className="fragment">
              <span className="hl">d</span> = depth of the shortest solution
            </li>
            <li className="fragment">The heuristic points the search at the goal</li>
          </ul>
        </div>
      </div>
      <p className="fragment takeaway">
        On &ldquo;infinite&rdquo; or massive graphs (a world map, every state of a puzzle), |V| and |E| stop meaning
        anything. A* never has to touch them all, so b and d describe the real cost.
      </p>
    </Slide>
  );
}

export function SpaceComplexitySlide() {
  return (
    <Slide>
      <h3>Space Complexity</h3>
      <div className="cols">
        <div className="card">
          <div className="card-label">Dijkstra</div>
          <div className="big-o">O(|V|)</div>
          <p className="card-note">A cost and a path for every vertex in the graph</p>
        </div>
        <div className="card">
          <div className="card-label astar">A*</div>
          <div className="big-o">O(b<sup>d</sup>)</div>
          <p className="card-note">Every node it generates waits in the open set or the visited set</p>
        </div>
      </div>
      <ul className="points">
        <li className="fragment">Same reasoning as time: each node visited costs one unit of work and one unit of memory</li>
        <li className="fragment">So time and space grow together, equally</li>
        <li className="fragment">A better heuristic means fewer nodes, which saves both</li>
      </ul>
    </Slide>
  );
}
