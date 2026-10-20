/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Converts array of 9 numbers to comma-separated string for hashing/visited sets
 * Pure JavaScript (ES6)
 */
export function stateToString(state) {
  return state.join(',');
}

/**
 * Converts string back to state
 */
export function stringToState(str) {
  const parts = str.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 9) return null;
  const set = new Set(parts);
  if (set.size !== 9) return null;
  for (let i = 0; i <= 8; i++) {
    if (!set.has(i)) return null;
  }
  return parts;
}

/**
 * Finds index of blank space (represented by 0)
 */
export function getBlankIndex(state) {
  return state.indexOf(0);
}

/**
 * Calculates number of inversions in a puzzle state (ignoring blank 0)
 */
export function countInversions(state) {
  let inversions = 0;
  const nonBlank = state.filter((x) => x !== 0);
  for (let i = 0; i < nonBlank.length; i++) {
    for (let j = i + 1; j < nonBlank.length; j++) {
      if (nonBlank[i] > nonBlank[j]) {
        inversions++;
      }
    }
  }
  return inversions;
}

/**
 * Solvability theorem for 8-Puzzle (3x3 grid):
 * Since grid width is odd (3), vertical moves do not change inversion parity.
 * An initial state can reach a goal state iff both states have the same parity of inversions!
 */
export function isSolvable(initial, goal) {
  const initialInv = countInversions(initial);
  const goalInv = countInversions(goal);
  return (initialInv % 2) === (goalInv % 2);
}

/**
 * Swaps two adjacent non-blank tiles to invert the parity, guaranteeing solvability
 */
export function makeSolvable(state, goal) {
  if (isSolvable(state, goal)) return [...state];
  const copy = [...state];
  let first = -1;
  let second = -1;
  for (let i = 0; i < copy.length; i++) {
    if (copy[i] !== 0) {
      if (first === -1) {
        first = i;
      } else {
        second = i;
        break;
      }
    }
  }
  if (first !== -1 && second !== -1) {
    const tmp = copy[first];
    copy[first] = copy[second];
    copy[second] = tmp;
  }
  return copy;
}

/**
 * Returns list of valid successor states by moving the blank (0)
 * Note: Action is defined as the direction the blank moves!
 * - UP: blank moves up (tile above moves down)
 * - DOWN: blank moves down (tile below moves up)
 * - LEFT: blank moves left (tile to the left moves right)
 * - RIGHT: blank moves right (tile to the right moves left)
 */
export function getValidMoves(state) {
  const blankIdx = getBlankIndex(state);
  const row = Math.floor(blankIdx / 3);
  const col = blankIdx % 3;
  const results = [];

  // UP: blank moves up (row > 0)
  if (row > 0) {
    const swapIdx = blankIdx - 3;
    const next = [...state];
    const movedTile = next[swapIdx];
    next[blankIdx] = movedTile;
    next[swapIdx] = 0;
    results.push({ action: 'UP', nextState: next, movedTile });
  }

  // DOWN: blank moves down (row < 2)
  if (row < 2) {
    const swapIdx = blankIdx + 3;
    const next = [...state];
    const movedTile = next[swapIdx];
    next[blankIdx] = movedTile;
    next[swapIdx] = 0;
    results.push({ action: 'DOWN', nextState: next, movedTile });
  }

  // LEFT: blank moves left (col > 0)
  if (col > 0) {
    const swapIdx = blankIdx - 1;
    const next = [...state];
    const movedTile = next[swapIdx];
    next[blankIdx] = movedTile;
    next[swapIdx] = 0;
    results.push({ action: 'LEFT', nextState: next, movedTile });
  }

  // RIGHT: blank moves right (col < 2)
  if (col < 2) {
    const swapIdx = blankIdx + 1;
    const next = [...state];
    const movedTile = next[swapIdx];
    next[blankIdx] = movedTile;
    next[swapIdx] = 0;
    results.push({ action: 'RIGHT', nextState: next, movedTile });
  }

  return results;
}

/**
 * Checks if current state matches the goal state
 */
export function isGoal(state, goal) {
  for (let i = 0; i < 9; i++) {
    if (state[i] !== goal[i]) return false;
  }
  return true;
}

/**
 * Heuristics calculations
 */
export function calculateHeuristic(state, goal, type = 'MANHATTAN') {
  if (type === 'MISPLACED') {
    let misplaced = 0;
    for (let i = 0; i < 9; i++) {
      if (state[i] !== 0 && state[i] !== goal[i]) {
        misplaced++;
      }
    }
    return misplaced;
  }

  const goalPos = new Map();
  for (let i = 0; i < 9; i++) {
    goalPos.set(goal[i], { r: Math.floor(i / 3), c: i % 3 });
  }

  let manhattan = 0;
  for (let i = 0; i < 9; i++) {
    const val = state[i];
    if (val !== 0) {
      const currR = Math.floor(i / 3);
      const currC = i % 3;
      const target = goalPos.get(val);
      manhattan += Math.abs(currR - target.r) + Math.abs(currC - target.c);
    }
  }

  if (type === 'MANHATTAN') {
    return manhattan;
  }

  // MANHATTAN_LINEAR: Adds 2 for each linear conflict
  let linearConflict = 0;
  for (let r = 0; r < 3; r++) {
    for (let c1 = 0; c1 < 2; c1++) {
      const idx1 = r * 3 + c1;
      const val1 = state[idx1];
      if (val1 === 0) continue;
      const target1 = goalPos.get(val1);
      if (target1.r !== r) continue;

      for (let c2 = c1 + 1; c2 < 3; c2++) {
        const idx2 = r * 3 + c2;
        const val2 = state[idx2];
        if (val2 === 0) continue;
        const target2 = goalPos.get(val2);
        if (target2.r !== r) continue;

        if (target1.c > target2.c) {
          linearConflict += 2;
        }
      }
    }
  }

  return manhattan + linearConflict;
}

/**
 * Generates a random solvable state from the goal by valid random walk (guaranteed solvable)
 */
export function generateRandomSolvableState(goal, steps = 30) {
  let curr = [...goal];
  let lastBlank = -1;

  for (let i = 0; i < steps; i++) {
    const moves = getValidMoves(curr);
    const filteredMoves = moves.filter((m) => getBlankIndex(m.nextState) !== lastBlank);
    const candidates = filteredMoves.length > 0 ? filteredMoves : moves;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    lastBlank = getBlankIndex(curr);
    curr = chosen.nextState;
  }

  if (isGoal(curr, goal)) {
    const moves = getValidMoves(curr);
    curr = moves[0].nextState;
  }

  return curr;
}

/**
 * Standard Presets
 */
export const PRESETS = {
  BOOK_EXAMPLE: {
    name: 'Assignment Document Benchmark',
    description: 'Classic 8-puzzle textbook instance specified in assignment prompt (~5 moves)',
    initial: [2, 8, 3, 1, 6, 4, 7, 0, 5],
    goal: [1, 2, 3, 8, 0, 4, 7, 6, 5],
  },
  EASY: {
    name: 'Easy (3 Moves)',
    description: 'Quick verification puzzle for instant step-by-step tracing',
    initial: [1, 2, 3, 0, 4, 6, 7, 5, 8],
    goal: [1, 2, 3, 4, 5, 6, 7, 8, 0],
  },
  MODERATE: {
    name: 'Moderate (8 Moves)',
    description: 'Demonstrates BFS level-by-level queue expansion and tree depth',
    initial: [1, 2, 3, 5, 0, 6, 4, 7, 8],
    goal: [1, 2, 3, 4, 5, 6, 7, 8, 0],
  },
  STANDARD: {
    name: 'Standard (14 Moves)',
    description: 'Classic configuration comparing uninformed vs informed search pruning',
    initial: [1, 3, 4, 8, 6, 2, 0, 7, 5],
    goal: [1, 2, 3, 8, 0, 4, 7, 6, 5],
  },
  CHALLENGING: {
    name: 'Challenging (18 Moves)',
    description: 'Reveals exponential memory growth of BFS vs A* heuristic guidance',
    initial: [2, 8, 1, 0, 4, 3, 7, 6, 5],
    goal: [1, 2, 3, 8, 0, 4, 7, 6, 5],
  },
};

export const DEFAULT_GOAL = [1, 2, 3, 8, 0, 4, 7, 6, 5];
export const CLASSIC_GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];
