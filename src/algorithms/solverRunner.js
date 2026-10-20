/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { solveAStar } from './astar.js';
import { solveBFS } from './bfs.js';
import { solveDFS } from './dfs.js';
import { solveDLS } from './dls.js';
import { solveGBFS } from './gbfs.js';
import { solveIDDLS } from './iddls.js';
import { solveUCS } from './ucs.js';

/**
 * Dispatches the search problem to the selected algorithm
 * Pure JavaScript (ES6)
 */
export function runSolver(algorithm, initialState, goalState, config = {}) {
  const {
    heuristic = 'MANHATTAN',
    depthLimit = 12,
    iddlsMaxDepth = 20,
    dfsDepthLimit = 40,
    recordSnapshots = true,
    maxSnapshots = 600,
  } = config;

  switch (algorithm) {
    case 'BFS':
      return solveBFS(initialState, goalState, { recordSnapshots, maxSnapshots });
    case 'DFS':
      return solveDFS(initialState, goalState, { maxDepthLimit: dfsDepthLimit, recordSnapshots, maxSnapshots });
    case 'DLS':
      return solveDLS(initialState, goalState, { depthLimit, recordSnapshots, maxSnapshots });
    case 'IDDLS':
      return solveIDDLS(initialState, goalState, { maxDepth: iddlsMaxDepth, recordSnapshots, maxSnapshots });
    case 'GBFS':
      return solveGBFS(initialState, goalState, { heuristic, recordSnapshots, maxSnapshots });
    case 'ASTAR':
      return solveAStar(initialState, goalState, { heuristic, recordSnapshots, maxSnapshots });
    case 'UCS':
      return solveUCS(initialState, goalState, { recordSnapshots, maxSnapshots });
    default:
      return solveBFS(initialState, goalState, { recordSnapshots, maxSnapshots });
  }
}

/**
 * Runs a comparative benchmark of all primary search algorithms on the identical puzzle instance
 */
export function runBenchmarkSuite(initialState, goalState) {
  const configs = [
    {
      algorithm: 'BFS',
      name: 'Breadth First Search (BFS)',
      completeness: 'Yes',
      optimality: 'Yes',
    },
    {
      algorithm: 'DFS',
      name: 'Depth First Search (DFS)',
      completeness: 'No',
      optimality: 'No',
    },
    {
      algorithm: 'DLS',
      name: 'Depth Limited Search (DLS)',
      depthLimit: 10,
      completeness: 'Conditional',
      optimality: 'No',
    },
    {
      algorithm: 'IDDLS',
      name: 'Iterative Deepening DLS (IDDLS)',
      completeness: 'Yes',
      optimality: 'Yes',
    },
    {
      algorithm: 'GBFS',
      name: 'Greedy Best First (Manhattan)',
      heuristic: 'MANHATTAN',
      heuristicLabel: 'Manhattan Distance',
      completeness: 'No',
      optimality: 'No',
    },
    {
      algorithm: 'ASTAR',
      name: 'A* Search (Misplaced)',
      heuristic: 'MISPLACED',
      heuristicLabel: 'Misplaced Tiles',
      completeness: 'Yes',
      optimality: 'Yes',
    },
    {
      algorithm: 'ASTAR',
      name: 'A* Search (Manhattan)',
      heuristic: 'MANHATTAN',
      heuristicLabel: 'Manhattan Distance',
      completeness: 'Yes',
      optimality: 'Yes',
    },
    {
      algorithm: 'UCS',
      name: 'Uniform Cost Search (UCS)',
      completeness: 'Yes',
      optimality: 'Yes',
    },
  ];

  return configs.map((cfg) => {
    try {
      const res = runSolver(cfg.algorithm, initialState, goalState, {
        heuristic: cfg.heuristic,
        depthLimit: cfg.depthLimit ?? 10,
        iddlsMaxDepth: 18,
        dfsDepthLimit: 40,
        recordSnapshots: false,
      });

      return {
        algorithm: cfg.algorithm,
        name: cfg.name,
        heuristic: cfg.heuristicLabel,
        solved: res.solved,
        nodesExpanded: res.nodesExpanded,
        nodesGenerated: res.nodesGenerated,
        movesCount: res.solved ? res.cost : -1,
        timeMs: Math.round(res.executionTimeMs * 10) / 10,
        memoryKb: res.approxMemoryKb,
        maxDepth: res.maxDepth,
        completeness: cfg.completeness,
        optimality: cfg.optimality,
        errorNote: res.reasonIfNotSolved,
      };
    } catch {
      return {
        algorithm: cfg.algorithm,
        name: cfg.name,
        heuristic: cfg.heuristicLabel,
        solved: false,
        nodesExpanded: 0,
        nodesGenerated: 0,
        movesCount: -1,
        timeMs: 0,
        memoryKb: 0,
        maxDepth: 0,
        completeness: cfg.completeness,
        optimality: cfg.optimality,
        errorNote: 'Execution halted or timed out',
      };
    }
  });
}
