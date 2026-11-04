"""Graph generators and the heuristics that go with them.

Every graph supports graph[u] -> [(v, weight), ...] and graph.position(u) -> (x, y),
so heuristics can measure how far a node is from the goal.
"""

import math
import random
from collections import deque
from dataclasses import dataclass


class Graph:
    """Finite, undirected, weighted graph whose vertices sit on a plane."""

    def __init__(self):
        self.adj = {}
        self.pos = {}

    def __getitem__(self, u):
        return self.adj[u]

    def position(self, u):
        return self.pos[u]

    def add_node(self, u, xy):
        self.adj.setdefault(u, [])
        self.pos[u] = xy

    def add_edge(self, u, v, weight):
        self.adj[u].append((v, weight))
        self.adj[v].append((u, weight))

    @property
    def node_count(self):
        return len(self.adj)

    @property
    def edge_count(self):
        return sum(len(n) for n in self.adj.values()) // 2


class InfiniteGrid:
    """A 4-connected grid that never ends. Neighbors are generated on demand,
    and walls come from a hash of (x, y), so the same seed always gives the same world."""

    node_count = math.inf
    edge_count = math.inf

    def __init__(self, wall_percent, seed, keep_open=()):
        self.wall_percent = wall_percent
        self.seed = seed
        self.keep_open = set(keep_open)

    def is_wall(self, x, y):
        if (x, y) in self.keep_open:
            return False
        return hash((x, y, self.seed)) % 100 < self.wall_percent

    def __getitem__(self, u):
        x, y = u
        return [((nx, ny), 1) for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))
                if not self.is_wall(nx, ny)]

    def position(self, u):
        return u


@dataclass
class Scenario:
    name: str
    group: str          # "random", "good", "bad" or "infinite"
    description: str
    graph: object
    start: object
    goal: object
    reachable: bool = True

    @property
    def finite(self):
        return not isinstance(self.graph, InfiniteGrid)

    @property
    def size_label(self):
        g = self.graph
        if not self.finite:
            return "infinite"
        return f"{g.node_count:,} nodes / {g.edge_count:,} edges"


# ---------- Heuristics ----------

def make_heuristic(name, graph, goal):
    """Returns h(u) for the named heuristic, measured from u to goal."""
    gx, gy = graph.position(goal)

    def euclidean(u):
        x, y = graph.position(u)
        return math.hypot(x - gx, y - gy)

    def manhattan(u):
        x, y = graph.position(u)
        return abs(x - gx) + abs(y - gy)

    heuristics = {
        "zero": lambda u: 0,
        "euclidean": euclidean,
        "manhattan": manhattan,
        "euclidean x2": lambda u: 2 * euclidean(u),
    }
    return heuristics[name]


# ---------- Random geometric graphs ----------

def random_geometric(n, seed, degree=6, stretch=0.5):
    """n points scattered uniformly over a square (about one point per unit area).
    Points within a radius are joined, giving roughly `degree` neighbors each.
    Edge weight = straight-line length x a random factor in [1, 1 + stretch],
    so straight-line distance never overestimates (Euclidean stays admissible)."""
    rng = random.Random(seed)
    side = math.sqrt(n)
    radius = math.sqrt(degree / math.pi)
    g = Graph()
    buckets = {}

    for i in range(n):
        xy = (rng.uniform(0, side), rng.uniform(0, side))
        g.add_node(i, xy)
        buckets.setdefault((int(xy[0] // radius), int(xy[1] // radius)), []).append(i)

    # Only nearby buckets can hold points within the radius.
    for (bx, by), members in buckets.items():
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for v in buckets.get((bx + dx, by + dy), ()):
                    for u in members:
                        if u < v:
                            d = math.dist(g.pos[u], g.pos[v])
                            if d <= radius:
                                g.add_edge(u, v, d * rng.uniform(1, 1 + stretch))

    # Run between opposite corners of the largest connected piece.
    component = _largest_component(g)
    start = min(component, key=lambda u: math.dist(g.pos[u], (0, 0)))
    goal = min(component, key=lambda u: math.dist(g.pos[u], (side, side)))
    return g, start, goal


def _largest_component(g):
    seen, best = set(), []
    for s in g.adj:
        if s in seen:
            continue
        seen.add(s)
        comp, queue = [s], deque([s])
        while queue:
            for v, _ in g.adj[queue.popleft()]:
                if v not in seen:
                    seen.add(v)
                    comp.append(v)
                    queue.append(v)
        if len(comp) > len(best):
            best = comp
    return best


# ---------- Grids ----------

def grid(width, height, walls=()):
    """4-connected grid with unit edge weights. Nodes are (x, y) tuples."""
    walls = set(walls)
    g = Graph()
    for y in range(height):
        for x in range(width):
            if (x, y) not in walls:
                g.add_node((x, y), (x, y))
    for (x, y) in list(g.adj):
        for v in ((x + 1, y), (x, y + 1)):
            if v in g.adj:
                g.add_edge((x, y), v, 1)
    return g


def _reachable(g, start, goal):
    seen, queue = {start}, deque([start])
    while queue:
        u = queue.popleft()
        if u == goal:
            return True
        for v, _ in g[u]:
            if v not in seen:
                seen.add(v)
                queue.append(v)
    return False


def random_maze_grid(size, wall_prob, seed):
    """Square grid with random walls, corner to corner. Re-rolls until a path exists."""
    while True:
        rng = random.Random(seed)
        start, goal = (0, 0), (size - 1, size - 1)
        walls = {(x, y) for x in range(size) for y in range(size)
                 if rng.random() < wall_prob and (x, y) not in (start, goal)}
        g = grid(size, size, walls)
        if _reachable(g, start, goal):
            return g, start, goal
        seed += 1


def open_grid_straight(size):
    """Good case: no obstacles, goal straight across. The heuristic is almost perfect."""
    g = grid(size, size)
    return g, (0, size // 2), (size - 1, size // 2)


def trap_grid(size):
    """Bad case: the start sits inside a cup whose open side faces away from the goal.
    The heuristic keeps pulling the search into the wall."""
    cx, cy, r = size // 4, size // 2, size // 6
    walls = set()
    for y in range(cy - r, cy + r + 1):
        walls.add((cx + r, y))                    # back wall, between start and goal
    for x in range(cx - r, cx + r + 1):
        walls.add((x, cy - r))                    # top arm
        walls.add((x, cy + r))                    # bottom arm
    g = grid(size, size, walls)
    return g, (cx, cy), (size - size // 8, cy)


def walled_off_goal(size):
    """Worst case: the goal is boxed in, so every algorithm has to explore everything
    before it can say there's no path. A* does exactly Dijkstra's work here."""
    goal = (size - 3, size - 3)
    gx, gy = goal
    walls = {(gx + dx, gy + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx, dy) != (0, 0)}
    g = grid(size, size, walls)
    return g, (0, 0), goal


# ---------- Scenario sets ----------

PRESETS = {
    "quick": dict(random_sizes=[1_000, 5_000], grid_size=60, infinite_dists=[50, 150]),
    "standard": dict(random_sizes=[1_000, 10_000, 50_000], grid_size=150, infinite_dists=[50, 200, 500]),
    "large": dict(random_sizes=[1_000, 10_000, 50_000, 200_000], grid_size=300, infinite_dists=[100, 500, 1_000]),
}


def build_scenarios(preset, seed):
    p = PRESETS[preset]
    out = []

    for n in p["random_sizes"]:
        g, s, t = random_geometric(n, seed)
        out.append(Scenario(f"Random geometric {n:,}", "random",
                            "Random points, nearby points joined; corner to corner.", g, s, t))

    size = p["grid_size"]
    g, s, t = random_maze_grid(size, 0.25, seed)
    out.append(Scenario(f"Random maze {size}x{size}", "random",
                        "Grid with 25% random walls; corner to corner.", g, s, t))

    g, s, t = open_grid_straight(size)
    out.append(Scenario(f"Open grid {size}x{size}", "good",
                        "No obstacles, goal straight ahead. Heuristic is nearly perfect.", g, s, t))

    g, s, t = trap_grid(size)
    out.append(Scenario(f"Trap grid {size}x{size}", "bad",
                        "Start inside a cup facing away from the goal. Heuristic misleads.", g, s, t))

    g, s, t = walled_off_goal(size)
    out.append(Scenario(f"Unreachable goal {size}x{size}", "bad",
                        "Goal is boxed in: everyone must explore the whole graph.", g, s, t,
                        reachable=False))

    for d in p["infinite_dists"]:
        start, goal = (0, 0), (d, d // 3)
        no_walls = InfiniteGrid(0, 0)
        keep_open = {start, goal, *(v for v, _ in no_walls[start]), *(v for v, _ in no_walls[goal])}
        g = InfiniteGrid(wall_percent=20, seed=seed, keep_open=keep_open)
        out.append(Scenario(f"Infinite grid, goal {d} away", "infinite",
                            "Grid that never ends (20% walls). Dijkstra can't finish the whole graph.",
                            g, start, goal))
    return out
