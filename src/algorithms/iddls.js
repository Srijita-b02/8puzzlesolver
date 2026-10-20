/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { solveDLS } from './dls.js';
import { isSolvable } from '../utils/puzzleUtils.js';

/**
 * Iterative Deepening Depth-Limited Search (IDDLS)
 * Runs DLS with depth limits 0, 1, 2, ... until goal is found or maxDepth reached.
 * Pure JavaScript (ES6)
 */
export function solveIDDLS(initialState, goalState, options = {}) {
  const startTime = performance.now();
  const {
    maxDepth = 25,
    recordSnapshots = true,
    maxSnapshots = 600,
  } = options;

  if (!isSolvable(initialState, goalState)) {
    return {
      algorithm: 'IDDLS',
      solved: false,
      path: [],
      moves: [],
      nodesGenerated: 0,
      nodesExpanded: 0,
      maxDepth: 0,
      executionTimeMs: performance.now() - startTime,
      cost: 0,
      approxMemoryKb: 0,
      reasonIfNotSolved: 'Initial state and Goal state have conflicting inversion parity (unsolvable).',
      snapshots: [],
    };
  }

  let totalNodesGenerated = 0;
  let totalNodesExpanded = 0;
  let maxDepthReached = 0;
  const aggregatedSnapshots = [];

  for (let limit = 0; limit <= maxDepth; limit++) {
    const dlsResult = solveDLS(initialState, goalState, {
      depthLimit: limit,
      recordSnapshots,
      maxSnapshots: Math.max(50, Math.floor(maxSnapshots / (limit + 1))),
    });

    totalNodesGenerated += dlsResult.nodesGenerated;
    totalNodesExpanded += dlsResult.nodesExpanded;
    if (dlsResult.maxDepth > maxDepthReached) {
      maxDepthReached = dlsResult.maxDepth;
    }

    if (dlsResult.snapshots && aggregatedSnapshots.length < maxSnapshots) {
      aggregatedSnapshots.push(...dlsResult.snapshots.slice(0, maxSnapshots - aggregatedSnapshots.length));
    }

    if (dlsResult.solved) {
      return {
        algorithm: 'IDDLS',
        solved: true,
        path: dlsResult.path,
        moves: dlsResult.moves,
        nodesGenerated: totalNodesGenerated,
        nodesExpanded: totalNodesExpanded,
        maxDepth: maxDepthReached,
        executionTimeMs: performance.now() - startTime,
        cost: dlsResult.cost,
        approxMemoryKb: Math.round((limit * 120 + 200) / 1024),
        snapshots: aggregatedSnapshots,
      };
    }
  }

  return {
    algorithm: 'IDDLS',
    solved: false,
    path: [],
    moves: [],
    nodesGenerated: totalNodesGenerated,
    nodesExpanded: totalNodesExpanded,
    maxDepth: maxDepthReached,
    executionTimeMs: performance.now() - startTime,
    cost: 0,
    approxMemoryKb: Math.round((maxDepth * 120) / 1024),
    reasonIfNotSolved: `IDDLS reached maximum iteration depth (${maxDepth}) without finding a solution.`,
    snapshots: aggregatedSnapshots,
  };
}
