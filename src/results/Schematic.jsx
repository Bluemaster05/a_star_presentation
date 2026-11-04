// Small illustrations of each benchmark graph. They're approximations: the real graphs
// are random or far too big to draw, so each picture is regenerated at a readable
// size from the same recipe demo/graphs.py uses.

const SIZE = 360;

// Seeded RNG (mulberry32) so a picture is the same every time the deck loads.
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Endpoints({ start, goal, r = 9 }) {
  return (
    <>
      <circle className="schem-start" cx={start[0]} cy={start[1]} r={r} />
      <circle className="schem-goal" cx={goal[0]} cy={goal[1]} r={r} />
    </>
  );
}

// ---------- Grids ----------

function GridPicture({ n, walls, start, goal, fade }) {
  const cell = SIZE / n;
  const center = ([x, y]) => [(x + 0.5) * cell, (y + 0.5) * cell];
  return (
    <>
      {fade && (
        <defs>
          <radialGradient id="schem-fade">
            <stop offset="55%" stopColor="#fff" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <mask id="schem-mask">
            <rect width={SIZE} height={SIZE} fill="url(#schem-fade)" />
          </mask>
        </defs>
      )}
      <g mask={fade ? 'url(#schem-mask)' : undefined}>
        <rect className="schem-floor" width={SIZE} height={SIZE} />
        {Array.from({ length: n + 1 }, (_, i) => (
          <g key={i} className="schem-gridline">
            <line x1={i * cell} y1={0} x2={i * cell} y2={SIZE} />
            <line x1={0} y1={i * cell} x2={SIZE} y2={i * cell} />
          </g>
        ))}
        {[...walls].map((k) => {
          const [x, y] = k.split(',').map(Number);
          return <rect key={k} className="schem-wall" x={x * cell} y={y * cell} width={cell} height={cell} />;
        })}
      </g>
      <Endpoints start={center(start)} goal={center(goal)} r={cell * 0.45 + 2} />
    </>
  );
}

function mazeWalls(n, prob, seed, keep) {
  const rand = rng(seed);
  const walls = new Set();
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (rand() < prob && !keep.includes(`${x},${y}`)) walls.add(`${x},${y}`);
  return walls;
}

function trapWalls(n) {
  const cx = Math.floor(n / 4);
  const cy = Math.floor(n / 2);
  const r = Math.floor(n / 6);
  const walls = new Set();
  for (let y = cy - r; y <= cy + r; y++) walls.add(`${cx + r},${y}`);
  for (let x = cx - r; x <= cx + r; x++) {
    walls.add(`${x},${cy - r}`);
    walls.add(`${x},${cy + r}`);
  }
  return { walls, start: [cx, cy], goal: [n - Math.floor(n / 8), cy] };
}

// ---------- Random geometric ----------

function GeometricPicture({ count, seed }) {
  const rand = rng(seed);
  const pad = 14;
  const pts = Array.from({ length: count }, () => [pad + rand() * (SIZE - 2 * pad), pad + rand() * (SIZE - 2 * pad)]);
  // Same rule as the benchmark: join points closer than the radius that gives ~6 neighbors.
  const radius = (SIZE - 2 * pad) * Math.sqrt(6 / Math.PI / count);
  const edges = [];
  for (let i = 0; i < count; i++)
    for (let j = i + 1; j < count; j++)
      if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) <= radius) edges.push([i, j]);
  // Start nearest the bottom-left corner, goal nearest the top-right, like graphs.py.
  const nearest = (cx, cy) => pts.reduce((best, p) => (Math.hypot(p[0] - cx, p[1] - cy) < Math.hypot(best[0] - cx, best[1] - cy) ? p : best));
  return (
    <>
      <rect className="schem-floor" width={SIZE} height={SIZE} />
      {edges.map(([i, j]) => (
        <line key={`${i}-${j}`} className="schem-edge" x1={pts[i][0]} y1={pts[i][1]} x2={pts[j][0]} y2={pts[j][1]} />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} className="schem-node" cx={x} cy={y} r={2.6} />
      ))}
      <Endpoints start={nearest(0, SIZE)} goal={nearest(SIZE, 0)} />
    </>
  );
}

// ---------- Picker ----------

function pictureFor(scenario) {
  const { name } = scenario;
  const n = 30;
  if (name.startsWith('Random geometric')) {
    // More real nodes -> a denser picture, capped so it stays readable.
    const count = Math.min(420, Math.round(60 + 40 * Math.log10(scenario.nodes)));
    return { el: <GeometricPicture count={count} seed={scenario.nodes} />, note: `${count} of ${scenario.nodes.toLocaleString()} nodes` };
  }
  if (name.startsWith('Random maze')) {
    const walls = mazeWalls(n, 0.25, 7, ['0,0', `${n - 1},${n - 1}`]);
    return { el: <GridPicture n={n} walls={walls} start={[0, 0]} goal={[n - 1, n - 1]} />, note: '25% random walls, corner to corner' };
  }
  if (name.startsWith('Open grid')) {
    const mid = Math.floor(n / 2);
    return { el: <GridPicture n={n} walls={new Set()} start={[0, mid]} goal={[n - 1, mid]} />, note: 'no walls, goal straight ahead' };
  }
  if (name.startsWith('Trap grid')) {
    const { walls, start, goal } = trapWalls(n);
    return { el: <GridPicture n={n} walls={walls} start={start} goal={goal} />, note: 'start inside a cup facing away from the goal' };
  }
  if (name.startsWith('Unreachable goal')) {
    const goal = [n - 3, n - 3];
    const walls = new Set();
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (dx || dy) walls.add(`${goal[0] + dx},${goal[1] + dy}`);
    return { el: <GridPicture n={n} walls={walls} start={[0, 0]} goal={goal} />, note: 'goal boxed in by walls' };
  }
  if (name.startsWith('Infinite grid')) {
    const start = [Math.floor(n / 2) - 6, Math.floor(n / 2) + 2];
    const goal = [start[0] + 12, start[1] - 4];
    const walls = mazeWalls(n, 0.2, 11, [`${start}`, `${goal}`]);
    return { el: <GridPicture n={n} walls={walls} start={start} goal={goal} fade />, note: 'continues forever in every direction' };
  }
  return null;
}

export default function Schematic({ scenario }) {
  const picture = pictureFor(scenario);
  if (!picture) return null;
  return (
    <figure className="schematic">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Illustration of ${scenario.name}`}>
        {picture.el}
      </svg>
      <figcaption>
        <span>
          <i className="schem-key start" /> start
        </span>
        <span>
          <i className="schem-key goal" /> goal
        </span>
        <span className="schem-note">Illustration, not to scale: {picture.note}</span>
      </figcaption>
    </figure>
  );
}
