"""Instrumented versions of the algorithms from the slides.

Each search works on any `graph` where graph[u] gives a list of (v, weight) pairs,
the same shape as algorithums.py, so infinite graphs can generate neighbors on demand.
Each returns a SearchResult holding the path plus the counters we benchmark.
"""

import heapq
from dataclasses import dataclass, field

INF = float("inf")


class BudgetExceeded(Exception):
    """Raised when a search expands more nodes than allowed (keeps infinite graphs safe)."""


@dataclass
class SearchResult:
    cost: float = INF          # total weight of the path found (inf if none)
    path: list = field(default_factory=list)
    expanded: int = 0          # nodes popped and processed ("nodes explored")
    pushed: int = 0            # heap pushes, i.e. nodes generated
    max_frontier: int = 0      # largest the priority queue ever got (memory proxy)
    gave_up: bool = False      # hit the expansion budget before finishing

    @property
    def found(self):
        return self.cost < INF


def _path(parent, goal):
    path = []
    while goal is not None:
        path.append(goal)
        goal = parent[goal]
    return path[::-1]


def dijkstra(graph, start, goal, stop_at_goal=True, budget=None):
    """Dijkstra from the slides. With stop_at_goal it returns as soon as the goal is
    popped (early exit). Without it, it settles every reachable vertex like the
    textbook version, then reads the start -> goal path out of the finished tree."""
    r = SearchResult()
    dist = {start: 0}
    parent = {start: None}
    pq = [(0, start)]
    r.pushed = 1

    while pq:
        r.max_frontier = max(r.max_frontier, len(pq))
        cost, u = heapq.heappop(pq)

        if cost > dist[u]:
            continue

        r.expanded += 1
        if budget and r.expanded > budget:
            r.gave_up = True
            return r

        if stop_at_goal and u == goal:
            r.cost, r.path = cost, _path(parent, u)
            return r

        for v, weight in graph[u]:
            new_cost = cost + weight

            if new_cost < dist.get(v, INF):
                dist[v] = new_cost
                parent[v] = u
                heapq.heappush(pq, (new_cost, v))
                r.pushed += 1

    if goal in dist:
        r.cost, r.path = dist[goal], _path(parent, goal)
    return r


def a_star(graph, start, goal, h, budget=None):
    """A* from the slides: priority f = g + h, stop when the goal is popped.
    Ties on f go to the smaller h (the node closer to the goal)."""
    r = SearchResult()
    g_score = {start: 0}
    parent = {start: None}
    pq = [(h(start), h(start), 0, start)]
    r.pushed = 1

    while pq:
        r.max_frontier = max(r.max_frontier, len(pq))
        _, _, g, u = heapq.heappop(pq)

        if g > g_score[u]:
            continue  # stale entry: we already found a cheaper way to u

        r.expanded += 1
        if budget and r.expanded > budget:
            r.gave_up = True
            return r

        if u == goal:
            r.cost, r.path = g_score[u], _path(parent, u)
            return r

        for v, weight in graph[u]:
            new_cost = g_score[u] + weight

            if new_cost < g_score.get(v, INF):
                g_score[v] = new_cost
                parent[v] = u
                hv = h(v)
                heapq.heappush(pq, (new_cost + hv, hv, new_cost, v))
                r.pushed += 1

    return r


def greedy_best_first(graph, start, goal, h, budget=None):
    """Greedy best-first: priority is h alone, so it ignores the cost paid so far.
    Each node is visited once; the first path to reach the goal is returned."""
    r = SearchResult()
    parent = {start: None}
    g_score = {start: 0}
    pq = [(h(start), start)]
    r.pushed = 1

    while pq:
        r.max_frontier = max(r.max_frontier, len(pq))
        _, u = heapq.heappop(pq)

        r.expanded += 1
        if budget and r.expanded > budget:
            r.gave_up = True
            return r

        if u == goal:
            r.cost, r.path = g_score[u], _path(parent, u)
            return r

        for v, weight in graph[u]:
            if v not in parent:
                parent[v] = u
                g_score[v] = g_score[u] + weight
                heapq.heappush(pq, (h(v), v))
                r.pushed += 1

    return r
