import { Slide } from '@revealjs/react';

// Both slides make the same point: A* has the same cost as Dijkstra. The two bounds
// are just two ways of measuring it, depending on whether the graph is finite.
function BoundCard({ label, bound, who, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <div className="card-label">{label}</div>
      <div className="big-o">{bound}</div>
      <div className="card-who">{who}</div>
      {children}
    </div>
  );
}

export function TimeComplexitySlide() {
  return (
    <Slide>
      <h3>Time Complexity</h3>
      <p className="lead">A* has two bounds. Which one you use depends on the graph.</p>
      <div className="cols">
        <BoundCard label="Finite graph" bound="O(|E| log |V|)" who="Dijkstra and A*: identical">
          <ul className="points small">
            <li className="fragment">Every edge |E| may be relaxed once</li>
            <li className="fragment">Each heap push / pop costs log |V|</li>
            <li className="fragment">Worst case A* explores everything, exactly like Dijkstra</li>
          </ul>
        </BoundCard>
        <BoundCard className="fragment" label="Infinite / massive graph" bound={<>O(b<sup>d</sup>)</>} who="Same cost, measured differently">
          <ul className="points small">
            <li className="fragment">
              |V| and |E| are unknown or infinite, so count by <span className="hl">b</span> (branching factor) and{' '}
              <span className="hl">d</span> (depth of the solution)
            </li>
            <li className="fragment">The heuristic aims the search at the goal, so it stops long before the graph runs out</li>
          </ul>
        </BoundCard>
      </div>
      <p className="fragment takeaway">
        A* matches Dijkstra&rsquo;s complexity exactly. We use b<sup>d</sup> because A*&rsquo;s efficiency is what
        makes infinite graphs (a world map, every state of a puzzle) reasonable to search at all.
      </p>
    </Slide>
  );
}

export function SpaceComplexitySlide() {
  return (
    <Slide>
      <h3>Space Complexity</h3>
      <div className="cols">
        <BoundCard label="Finite graph" bound="O(|V|)" who="Dijkstra and A*: identical">
          <p className="card-note">A cost and a path stored for every vertex</p>
        </BoundCard>
        <BoundCard label="Infinite / massive graph" bound={<>O(b<sup>d</sup>)</>} who="Same cost, measured differently">
          <p className="card-note">Every node generated waits in the open set or the visited set</p>
        </BoundCard>
      </div>
      <ul className="points">
        <li className="fragment">Same reasoning as time: each node visited costs one unit of work and one unit of memory</li>
        <li className="fragment">So time and space grow together, equally</li>
        <li className="fragment">A better heuristic means fewer nodes, which saves both</li>
      </ul>
    </Slide>
  );
}
