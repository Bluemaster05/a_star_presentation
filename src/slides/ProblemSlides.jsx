import { Slide } from '@revealjs/react';
import { Graph, steps } from './DijkstraSlide.jsx';

export function ShortestPathSlide() {
  return (
    <Slide>
      <h3>What is a Shortest Path?</h3>
      <p className="lead">
        Given a <span className="hl">weighted graph</span>, a <span className="hl">start</span> and a{' '}
        <span className="hl">goal</span>, find the route whose edge weights add up to the smallest total.
      </p>
      <ul className="points">
        <li className="fragment">Vertices are places, edges are connections, weights are the cost to travel</li>
        <li className="fragment">Cost can mean distance, time, money, or energy</li>
        <li className="fragment">
          The fewest edges is not always the cheapest:{' '}
          <span className="muted">A → B is 4, but A → C → B is 3</span>
        </li>
        <li className="fragment">
          Used everywhere: GPS navigation, video game AI, network routing, robotics
        </li>
      </ul>
    </Slide>
  );
}

export function ProblemGraphSlide() {
  return (
    <Slide>
      <h3>Our Example Graph</h3>
      <div className="problem">
        <Graph state={steps[0]} />
        <div className="problem-side">
          <p>
            Find the cheapest path from <span className="hl">A</span> to every other vertex.
          </p>
          <p className="fragment">
            We&rsquo;ll solve it with <span className="hl">Dijkstra&rsquo;s algorithm</span>, the foundation A* is built
            on.
          </p>
        </div>
      </div>
    </Slide>
  );
}
