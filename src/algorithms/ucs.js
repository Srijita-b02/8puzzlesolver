/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getValidMoves, isGoal, isSolvable, stateToString } from '../utils/puzzleUtils.js';
import { PriorityQueue } from './priorityQueue.js';

/**
 * Uniform Cost Search (UCS)
 * Explores state space in order of path cost g(n) using a Priority Queue.
 * Guarantees optimal path for any positive step costs.
 * Pure JavaScript (ES6)
 */
export function solveUCS(initialState, goalState, options = {}) {
  const startTime = performance.now();
  const {
    recordSnapshots = true,
    maxSnapshots = 600,
    maxNodes = 50000,
  } = options;

  if (!isSolvable(initialState, goalState)) {
    return {
      algorithm: 'UCS',
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
      algorithm: 'UCS',
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

  const pq = new PriorityQueue();
  pq.push(initialNode, 0);

  const costSoFar = new Map();
  costSoFar.set(stateToString(initialState), 0);

  const explored = new Set();
  const snapshots = [];
  let nodesGenerated = 1;
  let nodesExpanded = 0;
  let maxDepthReached = 0;
  let goalNode = null;

  while (!pq.isEmpty()) {
    if (nodesExpanded >= maxNodes) break;

    const currentNode = pq.pop();
    const currentStr = stateToString(currentNode.state);

    if (explored.has(currentStr)) continue;

    explored.add(currentStr);
    nodesExpanded++;

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
      const newCost = currentNode.depth + 1;
      const prevCost = costSoFar.get(nextStr);

      if (!isAlreadyExplored) {
        if (prevCost === undefined || newCost < prevCost) {
          costSoFar.set(nextStr, newCost);
          nodesGenerated++;

          const childNode = {
            id: `node-${nodesGenerated}`,
            state: move.nextState,
            parent: currentNode,
            action: move.action,
            movedTile: move.movedTile,
            depth: newCost,
            h: 0,
            f: newCost,
          };

          const isChildGoal = isGoal(move.nextState, goalState);
          stepSuccessors.push({
            state: move.nextState,
            action: move.action,
            movedTile: move.movedTile,
            status: isChildGoal ? 'goal' : 'enqueued',
            g: newCost,
            h: 0,
            f: newCost,
          });

          pq.push(childNode, newCost);
        } else {
          stepSuccessors.push({
            state: move.nextState,
            action: move.action,
            movedTile: move.movedTile,
            status: 'pruned',
            g: newCost,
            h: 0,
            f: newCost,
          });
        }
      } else {
        stepSuccessors.push({
          state: move.nextState,
          action: move.action,
          movedTile: move.movedTile,
          status: 'already_visited',
          g: newCost,
          h: 0,
          f: 0,
        });
      }
    }

    if (recordSnapshots && snapshots.length < maxSnapshots) {
      const sample = pq.toArray().slice(0, 8).map((entry) => ({
        state: [...entry.item.state],
        g: entry.item.depth,
        h: 0,
        f: entry.item.depth,
        depth: entry.item.depth,
      }));

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
        frontierSize: pq.size,
        exploredSize: explored.size,
        currentDepth: currentNode.depth,
        frontierQueueSample: sample,
      });
    }

    if (goalNode) break;
  }

  const executionTimeMs = performance.now() - startTime;
  const approxMemoryKb = Math.round(((nodesGenerated * 220) + (explored.size * 64)) / 1024);

  if (!goalNode) {
    return {
      algorithm: 'UCS',
      solved: false,
      path: [],
      moves: [],
      nodesGenerated,
      nodesExpanded,
      maxDepth: maxDepthReached,
      executionTimeMs,
      cost: 0,
      approxMemoryKb,
      reasonIfNotSolved: nodesExpanded >= maxNodes ? `UCS node limit (${maxNodes}) reached.` : 'No solution found.',
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
    algorithm: 'UCS',
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
