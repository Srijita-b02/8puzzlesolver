/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateHeuristic, getValidMoves, isGoal, isSolvable, stateToString } from '../utils/puzzleUtils.js';
import { PriorityQueue } from './priorityQueue.js';

/**
 * A* Search Algorithm
 * Uses evaluation function f(n) = g(n) + h(n)
 * Guarantees optimal path when heuristic is admissible.
 * Pure JavaScript (ES6)
 */
export function solveAStar(initialState, goalState, options = {}) {
  const startTime = performance.now();
  const {
    heuristic = 'MANHATTAN',
    recordSnapshots = true,
    maxSnapshots = 600,
    maxNodes = 50000,
  } = options;

  if (!isSolvable(initialState, goalState)) {
    return {
      algorithm: 'ASTAR',
      heuristic,
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

  const initialH = calculateHeuristic(initialState, goalState, heuristic);
  const initialNode = {
    id: 'node-0',
    state: [...initialState],
    parent: null,
    action: null,
    movedTile: null,
    depth: 0,
    h: initialH,
    f: initialH,
  };

  if (isGoal(initialState, goalState)) {
    return {
      algorithm: 'ASTAR',
      heuristic,
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

  const openSet = new PriorityQueue();
  openSet.push(initialNode, initialNode.f);

  const gScore = new Map();
  gScore.set(stateToString(initialState), 0);

  const explored = new Set();
  const snapshots = [];
  let nodesGenerated = 1;
  let nodesExpanded = 0;
  let maxDepthReached = 0;
  let goalNode = null;

  while (!openSet.isEmpty()) {
    if (nodesExpanded >= maxNodes) break;

    const currentNode = openSet.pop();
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
      const tentativeG = currentNode.depth + 1;
      const prevG = gScore.get(nextStr);

      if (!isAlreadyExplored) {
        if (prevG === undefined || tentativeG < prevG) {
          gScore.set(nextStr, tentativeG);
          nodesGenerated++;

          const h = calculateHeuristic(move.nextState, goalState, heuristic);
          const f = tentativeG + h;

          const childNode = {
            id: `node-${nodesGenerated}`,
            state: move.nextState,
            parent: currentNode,
            action: move.action,
            movedTile: move.movedTile,
            depth: tentativeG,
            h,
            f,
          };

          const isChildGoal = isGoal(move.nextState, goalState);
          stepSuccessors.push({
            state: move.nextState,
            action: move.action,
            movedTile: move.movedTile,
            status: isChildGoal ? 'goal' : 'enqueued',
            g: tentativeG,
            h,
            f,
          });

          openSet.push(childNode, f);
        } else {
          stepSuccessors.push({
            state: move.nextState,
            action: move.action,
            movedTile: move.movedTile,
            status: 'pruned',
            g: tentativeG,
            h: 0,
            f: 0,
          });
        }
      } else {
        stepSuccessors.push({
          state: move.nextState,
          action: move.action,
          movedTile: move.movedTile,
          status: 'already_visited',
          g: tentativeG,
          h: 0,
          f: 0,
        });
      }
    }

    if (recordSnapshots && snapshots.length < maxSnapshots) {
      const sample = openSet.toArray().slice(0, 8).map((entry) => ({
        state: [...entry.item.state],
        g: entry.item.depth,
        h: entry.item.h,
        f: entry.item.f,
        depth: entry.item.depth,
      }));

      snapshots.push({
        stepIndex: snapshots.length,
        currentNode: {
          state: [...currentNode.state],
          depth: currentNode.depth,
          g: currentNode.depth,
          h: currentNode.h,
          f: currentNode.f,
          action: currentNode.action,
          movedTile: currentNode.movedTile,
          parentState: currentNode.parent ? [...currentNode.parent.state] : undefined,
        },
        successors: stepSuccessors,
        frontierSize: openSet.size,
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
      algorithm: 'ASTAR',
      heuristic,
      solved: false,
      path: [],
      moves: [],
      nodesGenerated,
      nodesExpanded,
      maxDepth: maxDepthReached,
      executionTimeMs,
      cost: 0,
      approxMemoryKb,
      reasonIfNotSolved: nodesExpanded >= maxNodes ? `A* node expansion limit (${maxNodes}) reached.` : 'No solution found.',
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
    algorithm: 'ASTAR',
    heuristic,
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
