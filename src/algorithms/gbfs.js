/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateHeuristic, getValidMoves, isGoal, isSolvable, stateToString } from '../utils/puzzleUtils.js';
import { PriorityQueue } from './priorityQueue.js';

/**
 * Greedy Best-First Search (GBFS)
 * Prioritizes nodes purely by heuristic value h(n) towards the goal.
 * Pure JavaScript (ES6)
 */
export function solveGBFS(initialState, goalState, options = {}) {
  const startTime = performance.now();
  const {
    heuristic = 'MANHATTAN',
    recordSnapshots = true,
    maxSnapshots = 600,
    maxNodes = 40000,
  } = options;

  if (!isSolvable(initialState, goalState)) {
    return {
      algorithm: 'GBFS',
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
      algorithm: 'GBFS',
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

  const frontier = new PriorityQueue();
  frontier.push(initialNode, initialH);

  const explored = new Set();
  const inFrontier = new Map();
  inFrontier.set(stateToString(initialState), initialH);

  const snapshots = [];
  let nodesGenerated = 1;
  let nodesExpanded = 0;
  let maxDepthReached = 0;
  let goalNode = null;

  while (!frontier.isEmpty()) {
    if (nodesExpanded >= maxNodes) break;

    const currentNode = frontier.pop();
    const currentStr = stateToString(currentNode.state);

    if (explored.has(currentStr)) continue;

    explored.add(currentStr);
    inFrontier.delete(currentStr);
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

      if (!isAlreadyExplored) {
        const h = calculateHeuristic(move.nextState, goalState, heuristic);
        const existingH = inFrontier.get(nextStr);

        if (existingH === undefined || h < existingH) {
          nodesGenerated++;
          const childNode = {
            id: `node-${nodesGenerated}`,
            state: move.nextState,
            parent: currentNode,
            action: move.action,
            movedTile: move.movedTile,
            depth: currentNode.depth + 1,
            h,
            f: h,
          };

          const isChildGoal = isGoal(move.nextState, goalState);
          stepSuccessors.push({
            state: move.nextState,
            action: move.action,
            movedTile: move.movedTile,
            status: isChildGoal ? 'goal' : 'enqueued',
            g: childNode.depth,
            h,
            f: h,
          });

          inFrontier.set(nextStr, h);
          frontier.push(childNode, h);
        } else {
          stepSuccessors.push({
            state: move.nextState,
            action: move.action,
            movedTile: move.movedTile,
            status: 'pruned',
            g: currentNode.depth + 1,
            h,
            f: h,
          });
        }
      } else {
        stepSuccessors.push({
          state: move.nextState,
          action: move.action,
          movedTile: move.movedTile,
          status: 'already_visited',
          g: currentNode.depth + 1,
          h: 0,
          f: 0,
        });
      }
    }

    if (recordSnapshots && snapshots.length < maxSnapshots) {
      const sample = frontier.toArray().slice(0, 8).map((entry) => ({
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
        frontierSize: frontier.size,
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
      algorithm: 'GBFS',
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
      reasonIfNotSolved: nodesExpanded >= maxNodes ? `GBFS node expansion limit (${maxNodes}) reached.` : 'No solution found.',
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
    algorithm: 'GBFS',
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
