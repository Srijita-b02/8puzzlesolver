/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getValidMoves, isGoal, isSolvable, stateToString } from '../utils/puzzleUtils.js';

/**
 * Depth-Limited Search (DLS)
 * Like DFS, but with a strict cutoff depth L.
 * Pure JavaScript (ES6)
 */
export function solveDLS(initialState, goalState, options = {}) {
  const startTime = performance.now();
  const {
    depthLimit = 10,
    recordSnapshots = true,
    maxSnapshots = 600,
    maxNodes = 50000,
  } = options;

  if (!isSolvable(initialState, goalState)) {
    return {
      algorithm: 'DLS',
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
      algorithm: 'DLS',
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

  const stack = [initialNode];
  const visitedDepth = new Map();
  visitedDepth.set(stateToString(initialState), 0);

  const snapshots = [];
  let nodesGenerated = 1;
  let nodesExpanded = 0;
  let maxDepthReached = 0;
  let goalNode = null;
  let cutoffOccurred = false;

  while (stack.length > 0) {
    if (nodesExpanded >= maxNodes) break;

    const currentNode = stack.pop();
    nodesExpanded++;

    if (currentNode.depth > maxDepthReached) {
      maxDepthReached = currentNode.depth;
    }

    if (isGoal(currentNode.state, goalState)) {
      goalNode = currentNode;
      break;
    }

    const stepSuccessors = [];

    if (currentNode.depth < depthLimit) {
      const validMoves = getValidMoves(currentNode.state);

      for (const move of validMoves) {
        const nextStr = stateToString(move.nextState);
        const prevDepth = visitedDepth.get(nextStr);

        if (prevDepth === undefined || currentNode.depth + 1 < prevDepth) {
          nodesGenerated++;
          visitedDepth.set(nextStr, currentNode.depth + 1);

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

          if (isChildGoal) {
            goalNode = childNode;
            break;
          }

          stack.push(childNode);
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
    } else {
      cutoffOccurred = true;
    }

    if (recordSnapshots && snapshots.length < maxSnapshots) {
      snapshots.push({
        stepIndex: snapshots.length,
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
        frontierSize: stack.length,
        exploredSize: visitedDepth.size,
        currentDepth: currentNode.depth,
        frontierQueueSample: stack.slice(-8).reverse().map((n) => ({
          state: [...n.state],
          g: n.depth,
          h: 0,
          f: n.depth,
          depth: n.depth,
        })),
      });
    }

    if (goalNode) break;
  }

  const executionTimeMs = performance.now() - startTime;
  const approxMemoryKb = Math.round(((nodesGenerated * 200) + (visitedDepth.size * 64)) / 1024);

  if (!goalNode) {
    return {
      algorithm: 'DLS',
      solved: false,
      path: [],
      moves: [],
      nodesGenerated,
      nodesExpanded,
      maxDepth: maxDepthReached,
      executionTimeMs,
      cost: 0,
      approxMemoryKb,
      reasonIfNotSolved: cutoffOccurred
        ? `Cutoff: No solution found within depth limit ${depthLimit}. Try increasing the depth limit.`
        : 'Search space exhausted without finding goal.',
      snapshots,
    };
  }

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
    algorithm: 'DLS',
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
