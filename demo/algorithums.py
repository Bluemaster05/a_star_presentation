import heapq

def dijkstra(graph, start):
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

    return dist

def a_star(graph, start, goal, h):
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

    return float("inf")

if __name__ == "__main__":
    graph = {
        "A": [("B", 4), ("C", 1)],
        "B": [("D", 1)],
        "C": [("B", 2), ("D", 5)],
        "D": []
    }

    print(dijkstra(graph, "A"))
    print(a_star(graph, "A", "D", lambda x: 0))
    # {'A': 0, 'C': 1, 'B': 3, 'D': 4}