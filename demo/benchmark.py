"""Benchmark Dijkstra vs A* (several heuristics) vs Greedy Best-First.

Usage:
    python benchmark.py                      # standard preset
    python benchmark.py --preset quick       # fast run, smaller graphs
    python benchmark.py --preset large --repeats 5
    python benchmark.py --heuristics euclidean manhattan

Results print to the terminal and are saved to results/ as a .txt report and a .csv.
"""

import argparse
import csv
import statistics
import sys
import time
from datetime import datetime
from pathlib import Path

from graphs import PRESETS, build_scenarios, make_heuristic
from search import a_star, dijkstra, greedy_best_first

HEURISTICS = ["zero", "euclidean", "manhattan", "euclidean x2"]
BASELINE = "Dijkstra (stop at goal)"

# Admissible on every graph here, so A* with these must match the optimal cost.
# Manhattan is admissible on the grids but can overestimate on the random geometric graphs.
ALWAYS_ADMISSIBLE = {"zero", "euclidean"}


def algorithms(heuristics):
    """(label, heuristic name or None, runner, finite_only, guarantees_shortest)"""
    algos = [
        ("Dijkstra (full graph)", None,
         lambda g, s, t, h, **kw: dijkstra(g, s, t, stop_at_goal=False, **kw), True, True),
        (BASELINE, None, lambda g, s, t, h, **kw: dijkstra(g, s, t, **kw), False, True),
    ]
    for name in heuristics:
        label = "Weighted A* (euclidean x2)" if name == "euclidean x2" else f"A* ({name})"
        algos.append((label, name, lambda g, s, t, h, **kw: a_star(g, s, t, h, **kw), False,
                      name in ALWAYS_ADMISSIBLE))
    algos.append(("Greedy best-first (euclidean)", "euclidean",
                  lambda g, s, t, h, **kw: greedy_best_first(g, s, t, h, **kw), False, False))
    return algos


def time_run(run, repeats):
    """Median wall time over `repeats` runs. Slow runs (>1s) are only timed once."""
    times = []
    for _ in range(repeats):
        begin = time.perf_counter()
        result = run()
        times.append(time.perf_counter() - begin)
        if times[-1] > 1:
            break
    return result, statistics.median(times) * 1000


def run_scenario(sc, algos, repeats, budget):
    rows = []
    for label, h_name, runner, finite_only, guaranteed in algos:
        if finite_only and not sc.finite:
            rows.append(dict(algorithm=label, skipped="can't finish an infinite graph"))
            continue
        h = make_heuristic(h_name, sc.graph, sc.goal) if h_name else None
        result, ms = time_run(lambda: runner(sc.graph, sc.start, sc.goal, h, budget=budget), repeats)
        rows.append(dict(algorithm=label, heuristic=h_name or "-", result=result, ms=ms,
                         guaranteed=guaranteed))
    return rows


def path_problem(graph, path, start, goal, cost):
    """Checks a returned path really is a start -> goal walk with the claimed cost.
    Returns a description of what's wrong, or None if it's valid."""
    if path[0] != start or path[-1] != goal:
        return "path doesn't run start -> goal"
    total = 0
    for u, v in zip(path, path[1:]):
        weights = [w for n, w in graph[u] if n == v]
        if not weights:
            return f"no edge {u} -> {v}"
        total += min(weights)
    if abs(total - cost) > 1e-6:
        return f"edges add to {total:.2f}, not {cost:.2f}"
    return None


def status(row, sc, optimal):
    r = row["result"]
    if r.gave_up:
        return "gave up (budget)"
    if not r.found:
        return "no path" if not sc.reachable else "BUG: missed a path"
    problem = path_problem(sc.graph, r.path, sc.start, sc.goal, r.cost)
    if problem:
        return f"BUG: {problem}"
    if optimal is not None and r.cost > optimal + 1e-9:
        return "BUG: should be shortest" if row["guaranteed"] else "longer than shortest"
    return "shortest"


def short_path(path, keep=4):
    nodes = [str(n) for n in path]
    if len(nodes) > 2 * keep + 1:
        nodes = nodes[:keep] + ["..."] + nodes[-keep:]
    return " -> ".join(nodes)


def reference(rows):
    """Optimal cost and baseline numbers for comparison columns."""
    by_label = {r["algorithm"]: r for r in rows if "result" in r}
    base = by_label.get(BASELINE)
    optimal = None
    for r in by_label.values():
        if r["guaranteed"] and r["result"].found and not r["result"].gave_up:
            optimal = r["result"].cost
            break
    return base, optimal


class Report:
    """Prints to the terminal and keeps a copy for the text file."""

    def __init__(self):
        self.lines = []

    def __call__(self, text=""):
        print(text)
        self.lines.append(text)


def table(report, headers, data, align):
    widths = [max(len(h), *(len(r[i]) for r in data)) for i, h in enumerate(headers)]
    fmt = lambda cells: "  ".join(c.ljust(w) if a == "<" else c.rjust(w)
                                  for c, w, a in zip(cells, widths, align))
    report(fmt(headers))
    report("  ".join("-" * w for w in widths))
    for r in data:
        report(fmt(r))


def fmt_num(x, digits=0):
    return f"{x:,.{digits}f}"


def print_scenario(report, sc, rows):
    base, optimal = reference(rows)
    report()
    report(f"== {sc.name}  [{sc.group}]  ({sc.size_label})")
    report(f"   {sc.description}")
    headers = ["Algorithm", "Time ms", "Speedup", "Explored", "% of Dijkstra", "Generated",
               "Max frontier", "Path cost", "vs optimal", "Path edges", "Result"]
    data, csv_rows, paths = [], [], []
    for row in rows:
        if "skipped" in row:
            data.append([row["algorithm"], "-", "-", "-", "-", "-", "-", "-", "-", "-", f"skipped: {row['skipped']}"])
            continue
        r, ms = row["result"], row["ms"]
        has_base = base and not base["result"].gave_up
        speedup = base["ms"] / ms if has_base and ms > 0 else None
        pct = 100 * r.expanded / base["result"].expanded if has_base else None
        cost_ratio = r.cost / optimal if r.found and optimal else None
        st = status(row, sc, optimal)
        if r.path:
            paths.append([row["algorithm"], f"{len(r.path):,} nodes", short_path(r.path)])
        data.append([
            row["algorithm"],
            fmt_num(ms, 2),
            f"{speedup:.1f}x" if speedup else "-",
            fmt_num(r.expanded),
            f"{pct:.1f}%" if pct is not None else "-",
            fmt_num(r.pushed),
            fmt_num(r.max_frontier),
            fmt_num(r.cost, 2) if r.found else "-",
            f"{100 * cost_ratio:.1f}%" if cost_ratio else "-",
            fmt_num(len(r.path) - 1) if r.path else "-",
            st,
        ])
        csv_rows.append(dict(
            scenario=sc.name, group=sc.group, nodes=sc.graph.node_count, edges=sc.graph.edge_count,
            algorithm=row["algorithm"], heuristic=row["heuristic"], time_ms=round(ms, 4),
            speedup_vs_dijkstra=round(speedup, 3) if speedup else "",
            nodes_explored=r.expanded, pct_of_dijkstra_explored=round(pct, 2) if pct is not None else "",
            nodes_generated=r.pushed, max_frontier=r.max_frontier,
            path_cost=round(r.cost, 4) if r.found else "",
            cost_vs_optimal=round(cost_ratio, 4) if cost_ratio else "",
            path_edges=len(r.path) - 1 if r.path else "", result=st,
            path=" ".join(str(n).replace(" ", "") for n in r.path),
        ))
    table(report, headers, data, "<" + ">" * 9 + "<")
    if paths:
        report()
        report(f"   Paths from {sc.start} to {sc.goal} (full node lists are in the CSV):")
        for label, count, text in paths:
            report(f"   {label:<30} {count:>12}  {text}")
    return csv_rows


def print_summary(report, all_results):
    report()
    report("=" * 30 + " SUMMARY " + "=" * 30)
    report(f"Explored nodes and speedup are relative to {BASELINE}.")
    report()
    labels = [r["algorithm"] for r in all_results[0][1]
              if r["algorithm"] not in ("Dijkstra (full graph)", BASELINE)]
    headers = ["Scenario"] + labels
    data = []
    for sc, rows in all_results:
        base, optimal = reference(rows)
        by_label = {r["algorithm"]: r for r in rows if "result" in r}
        cells = [sc.name]
        for label in labels:
            row = by_label.get(label)
            if not row:
                cells.append("-")
                continue
            r = row["result"]
            if r.gave_up:
                cells.append("gave up")
            elif base and not base["result"].gave_up:
                pct = 100 * r.expanded / base["result"].expanded
                cells.append(f"{pct:.0f}% nodes, {base['ms'] / row['ms']:.1f}x")
            else:
                cells.append(f"{r.expanded:,} nodes")
            if r.found and optimal and r.cost > optimal + 1e-9:
                cells[-1] += f" (+{100 * (r.cost / optimal - 1):.0f}% cost)"
        data.append(cells)
    table(report, headers, data, "<" * len(headers))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--preset", choices=PRESETS, default="standard", help="graph sizes to run")
    parser.add_argument("--repeats", type=int, default=3, help="timing runs per algorithm (median is reported)")
    parser.add_argument("--seed", type=int, default=42, help="random seed for graph generation")
    parser.add_argument("--heuristics", nargs="+", choices=HEURISTICS, default=["euclidean", "manhattan", "euclidean x2"],
                        help="heuristics to try with A*")
    parser.add_argument("--budget", type=int, default=1_000_000, help="max nodes any search may explore")
    parser.add_argument("--out", type=Path, default=Path(__file__).parent / "results", help="folder for result files")
    args = parser.parse_args()

    report = Report()
    report(f"A* benchmark  |  preset={args.preset}  seed={args.seed}  repeats={args.repeats}  "
           f"budget={args.budget:,}  python={sys.version.split()[0]}")
    report(f"Run at {datetime.now():%Y-%m-%d %H:%M:%S}")

    print("\nBuilding graphs...", flush=True)
    scenarios = build_scenarios(args.preset, args.seed)
    algos = algorithms(args.heuristics)

    all_results, csv_rows = [], []
    for sc in scenarios:
        rows = run_scenario(sc, algos, args.repeats, args.budget)
        all_results.append((sc, rows))
        csv_rows += print_scenario(report, sc, rows)

    print_summary(report, all_results)

    args.out.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    txt_path = args.out / f"benchmark_{args.preset}_{stamp}.txt"
    csv_path = args.out / f"benchmark_{args.preset}_{stamp}.csv"
    txt_path.write_text("\n".join(report.lines) + "\n", encoding="utf-8")
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(csv_rows[0]))
        writer.writeheader()
        writer.writerows(csv_rows)

    print(f"\nSaved {txt_path}\nSaved {csv_path}")


if __name__ == "__main__":
    main()
