/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getValidMoves, isGoal, isSolvable, stateToString } from '../utils/puzzleUtils.js';

/**
 * Breadth-First Search (BFS) for 8-Puzzle
 * Explores state space level-by-level using a FIFO Queue.
 * Guarantees optimal (shortest) path for uniform step costs.
 * Pure JavaScript (ES6)
 */
export function solveBFS(initialState, goalState, options = {}) {
  const startTime = performance.now();
  const {
    recordSnapshots = true,
    maxSnapshots = 600,
    maxNodes = 200000,
  } = options;

  // 1. Solvability pre-check
  if (!isSolvable(initialState, goalState)) {
    return {
      algorithm: 'BFS',
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

  // 2. Goal check on initial state
  const initialNode = {
    id: 'node-0',
    state: [...initialState],
    parent: null,
    action: null,
    movedTile: null,
    depth: 0,
    h: 0,
    f: 0,
  };

  if (isGoal(initialState, goalState)) {
    return {
      algorithm: 'BFS',
      solved: true,
      path: [initialNode],
      moves: [],
      nodesGenerated: 1,
      nodesExpanded: 0,
      maxDepth: 0,
      executionTimeMs: performance.now() - startTime,
      cost: 0,
      approxMemoryKb: 1,
      snapshots: [],
    };
  }

  // 3. FIFO Queue for Frontier and Explored Set
  const queue = [initialNode];
  const explored = new Set();
  const inFrontier = new Map();
  inFrontier.set(stateToString(initialState), initialNode);

  const snapshots = [];
  const recentExplored = []; // last few explored states (for the live closed-list view)
  let nodesGenerated = 1;
  let nodesExpanded = 0;
  let maxDepthReached = 0;
  let goalNode = null;

  while (queue.length > 0) {
    if (nodesExpanded >= maxNodes) {
      break;
    }

    const currentNode = queue.shift();
    const currentStr = stateToString(currentNode.state);
    inFrontier.delete(currentStr);
    explored.add(currentStr);
    nodesExpanded++;
    recentExplored.push(currentNode.state);
    if (recentExplored.length > 12) recentExplored.shift();

    if (currentNode.depth > maxDepthReached) {
      maxDepthReached = currentNode.depth;
    }

    if (isGoal(currentNode.state, goalState)) {
      goalNode = currentNode;
      break;
    }

    const validMoves = getValidMoves(currentNode.state);
    const stepSuccessors = [];

    for (const move of validMoves) {
      const nextStr = stateToString(move.nextState);
      const isAlreadyExplored = explored.has(nextStr);
      const isAlreadyInFrontier = inFrontier.has(nextStr);

      if (!isAlreadyExplored && !isAlreadyInFrontier) {
        nodesGenerated++;
        const childNode = {
          id: `node-${nodesGenerated}`,
          state: move.nextState,
          parent: currentNode,
          action: move.action,
          movedTile: move.movedTile,
          depth: currentNode.depth + 1,
          h: 0,
          f: currentNode.depth + 1,
        };

        const isChildGoal = isGoal(move.nextState, goalState);

        stepSuccessors.push({
          state: move.nextState,
          action: move.action,
          movedTile: move.movedTile,
          status: isChildGoal ? 'goal' : 'enqueued',
          g: childNode.depth,
          h: 0,
          f: childNode.depth,
        });

        // Eager goal check optimization (standard textbook AI)
        if (isChildGoal) {
          goalNode = childNode;
          queue.push(childNode);
          inFrontier.set(nextStr, childNode);
          break;
        }

        queue.push(childNode);
        inFrontier.set(nextStr, childNode);
      } else {
        stepSuccessors.push({
          state: move.nextState,
          action: move.action,
          movedTile: move.movedTile,
          status: 'already_visited',
          g: currentNode.depth + 1,
          h: 0,
          f: currentNode.depth + 1,
        });
      }
    }

    // Record step snapshot for live exploration playback
    // Keep the first maxSnapshots expansions, plus the final step that reaches the goal
    if (recordSnapshots && (snapshots.length < maxSnapshots || goalNode)) {
      snapshots.push({
        stepIndex: snapshots.length,
        expansionNumber: nodesExpanded,
        generatedSoFar: nodesGenerated,
        currentNode: {
          state: [...currentNode.state],
          depth: currentNode.depth,
          g: currentNode.depth,
          h: 0,
          f: currentNode.depth,
          action: currentNode.action,
          movedTile: currentNode.movedTile,
          parentState: currentNode.parent ? [...currentNode.parent.state] : undefined,
        },
        successors: stepSuccessors,
        frontierSize: queue.length,
        exploredSize: explored.size,
        exploredRecent: recentExplored.slice().reverse().map((s) => [...s]),
        currentDepth: currentNode.depth,
        frontierQueueSample: queue.slice(0, 12).map((n) => ({
          state: [...n.state],
          g: n.depth,
          h: 0,
          f: n.depth,
          depth: n.depth,
        })),
      });
    }

    if (goalNode) {
      break;
    }
  }

  const executionTimeMs = performance.now() - startTime;
  const approxMemoryKb = Math.round(((nodesGenerated * 220) + (explored.size * 64)) / 1024);

  if (!goalNode) {
    return {
      algorithm: 'BFS',
      solved: false,
      path: [],
      moves: [],
      nodesGenerated,
      nodesExpanded,
      maxDepth: maxDepthReached,
      executionTimeMs,
      cost: 0,
      approxMemoryKb,
      reasonIfNotSolved: nodesExpanded >= maxNodes ? `Search tree exceeded limit of ${maxNodes} nodes.` : 'No solution exists.',
      snapshots,
    };
  }

  // Reconstruct path
  const path = [];
  const moves = [];
  let curr = goalNode;

  while (curr) {
    path.unshift(curr);
    if (curr.action && curr.movedTile !== null) {
      moves.unshift({
        action: curr.action,
        state: [...curr.state],
        movedTile: curr.movedTile,
      });
    }
    curr = curr.parent;
  }

  return {
    algorithm: 'BFS',
    solved: true,
    path,
    moves,
    nodesGenerated,
    nodesExpanded,
    maxDepth: maxDepthReached,
    executionTimeMs,
    cost: path.length - 1,
    approxMemoryKb,
    snapshots,
  };
}
