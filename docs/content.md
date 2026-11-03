1. The Problem
    - What is shortest path?
    - Show the graph that we are going to solve with djikstras
2. Associated Alogrithms
    - Djikstra's - Basis for a*
    - Breadth-First Search - simple, but inefficent
    - Greedy Best-First Search - similar to a* cause of heuristic. But not guarenteed shortest.
3. How A* works
    - Explain Djikstra's first. Show the djikstra's example.
    - Show to djikstra vs a star code snippets. -animate it with the fancy dim and focus code effect that reveal js has. I want to highlight that these each do the same thing and the only difference is the heuristic and a star only focusing on start and end and stoping after that.
    - Show the Djikstr's and a star example.
4. Time Complexity 
    - O(|E|log|v|) and O(b^d) show that in a finite graph the e and v make sense. But since a star can use its heuristic to be directional and more effiecient, we can work on "infinite" graphs or just massive ones and then the b and d make more sense.
5. Space Complexity
    - Explain that for the same reasons the space complexity is the same since the more nodes visited means more time and more space in equalness
6. Correctness
    - Depends on the heurisitc. If it is admissable and Consistant
    - Explain Admissable
    - Explain Consistant 
7. Python implementation
8. Demo
9. Results