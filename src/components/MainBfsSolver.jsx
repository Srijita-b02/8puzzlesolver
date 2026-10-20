/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { solveBFS } from '../algorithms/bfs';
import {
  countInversions,
  getBlankIndex,
  getValidMoves,
  isGoal,
  isSolvable,
  makeSolvable,
  PRESETS,
  stringToState,
} from '../utils/puzzleUtils';
import { PuzzleBoard } from './PuzzleBoard';
import { MiniBoard } from './MiniBoard';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Dices,
  Hand,
  Bot,
  Clock,
  ArrowRight,
  Edit3,
  Bookmark,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ListOrdered,
  ChevronDown,
} from 'lucide-react';

// Number of BFS expansions recorded for the live search replay (plus the final step)
const MAX_SEARCH_SNAPSHOTS = 500;

export const MainBfsSolver = ({
  initialState,
  setInitialState,
  goalState,
  setGoalState,
  onGoToComparison,
}) => {
  // Initial and Goal states are owned by App (shared with the Comparison page).
  // Defaults: initial 2 8 3 / 1 6 4 / 7 _ 5  and  goal 1 2 3 / 8 _ 4 / 7 6 5

  // Current interactive board state
  const [boardState, setBoardState] = useState([...initialState]);

  // Mode:
  // 'play' -> User solves it themselves (every move counts as 1)
  // 'bfs'  -> AI solves with BFS algorithm and animates moves
  // 'setup' -> Arrange initial state by clicking and moving tiles
  const [mode, setMode] = useState('play');

  // Custom Input State Modal / Panel toggle
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputText, setCustomInputText] = useState(
    initialState.join(' ')
  );
  const [customGoalText, setCustomGoalText] = useState(goalState.join(' '));
  const [customInputError, setCustomInputError] = useState(null);

  // Human play statistics
  const [userMovesCount, setUserMovesCount] = useState(0);
  const [userTimerSeconds, setUserTimerSeconds] = useState(0);
  const [userTimerActive, setUserTimerActive] = useState(false);
  const [userLastMovedTile, setUserLastMovedTile] = useState(null);
  const [userLastAction, setUserLastAction] = useState(null);

  // BFS Algorithm State
  const [bfsResult, setBfsResult] = useState(null);
  const [bfsStepIndex, setBfsStepIndex] = useState(0);
  const [isPlayingBfs, setIsPlayingBfs] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const bfsTimerRef = useRef(null);

  // Inspector Sub-tab: 'metrics' (Nodes, time, successors) vs 'steps' (Walkthrough list)
  const [inspectorTab, setInspectorTab] = useState('search');

  // Live search replay (steps through the BFS expansions, independent of the solution-path playback)
  const [searchStep, setSearchStep] = useState(0);
  const [isPlayingSearch, setIsPlayingSearch] = useState(false);

  // Which way the current puzzle was created: 'benchmark' | 'random' | 'custom' (highlighted in red)
  const [puzzleSource, setPuzzleSource] = useState('benchmark');

  // Dropdown that lists every state from the initial state to the goal
  const [showSolutionStates, setShowSolutionStates] = useState(false);

  /**
   * Dedicated function in MainBfsSolver to generate a random solvable 8-puzzle state
   * by performing random valid moves from the goal state to guarantee solvability.
   */
  const generateRandomSolvablePuzzle = (steps = 24) => {
    let current = [...goalState];
    let lastBlankIdx = -1;

    for (let i = 0; i < steps; i++) {
      const validMoves = getValidMoves(current);
      // Avoid immediately reversing the prior step
      const nonReversingMoves = validMoves.filter(
        (m) => getBlankIndex(m.nextState) !== lastBlankIdx
      );
      const candidates =
        nonReversingMoves.length > 0 ? nonReversingMoves : validMoves;
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      lastBlankIdx = getBlankIndex(current);
      current = chosen.nextState;
    }

    // Ensure it is not already at goal
    if (isGoal(current, goalState)) {
      const moves = getValidMoves(current);
      current = moves[0].nextState;
    }

    return current;
  };

  /**
   * Handler for the 'Randomize' button
   */
  const handleRandomize = () => {
    const randomState = generateRandomSolvablePuzzle(22);
    setPuzzleSource('random');
    setInitialState(randomState);
    setBoardState(randomState);
    setCustomInputText(randomState.join(' '));
    setUserMovesCount(0);
    setUserTimerSeconds(0);
    setUserTimerActive(false);
    setUserLastMovedTile(null);
    setUserLastAction(null);
    setBfsStepIndex(0);
    setIsPlayingBfs(false);
    setCustomInputError(null);
  };

  /**
   * Load textbook assignment benchmark
   */
  const handleLoadBookBenchmark = () => {
    const book = [...PRESETS.BOOK_EXAMPLE.initial];
    setPuzzleSource('benchmark');
    setGoalState([...PRESETS.BOOK_EXAMPLE.goal]);
    setCustomGoalText(PRESETS.BOOK_EXAMPLE.goal.join(' '));
    setInitialState(book);
    setBoardState(book);
    setCustomInputText(book.join(' '));
    setUserMovesCount(0);
    setUserTimerSeconds(0);
    setUserTimerActive(false);
    setUserLastMovedTile(null);
    setUserLastAction(null);
    setBfsStepIndex(0);
    setIsPlayingBfs(false);
    setCustomInputError(null);
    setShowCustomInput(false);
  };

  /**
   * Apply user custom typed start state
   */
  const handleApplyCustomState = () => {
    const parsed = stringToState(customInputText.replace(/_/g, '0'));
    if (!parsed) {
      setCustomInputError(
        'Initial state must contain numbers 0 to 8 exactly once (use 0 or _ for blank).'
      );
      return;
    }
    const parsedGoal = stringToState(customGoalText.replace(/_/g, '0'));
    if (!parsedGoal) {
      setCustomInputError(
        'Goal state must contain numbers 0 to 8 exactly once (use 0 or _ for blank).'
      );
      return;
    }

    setCustomInputError(null);
    setPuzzleSource('custom');
    setGoalState(parsedGoal);
    setInitialState(parsed);
    setBoardState(parsed);
    setUserMovesCount(0);
    setUserTimerSeconds(0);
    setUserTimerActive(false);
    setUserLastMovedTile(null);
    setUserLastAction(null);
    setBfsStepIndex(0);
    setIsPlayingBfs(false);
    setShowCustomInput(false);
  };

  /**
   * Auto-fix parity if user entered unsolvable state
   */
  const handleAutoFixParity = () => {
    const fixed = makeSolvable(initialState, goalState);
    setInitialState(fixed);
    setBoardState(fixed);
    setCustomInputText(fixed.join(' '));
    setCustomInputError(null);
  };

  // Compute BFS optimal solution whenever initialState changes
  useEffect(() => {
    const res = solveBFS(initialState, goalState, {
      recordSnapshots: true,
      maxSnapshots: MAX_SEARCH_SNAPSHOTS,
      maxNodes: 200000,
    });
    setBfsResult(res);
    setBfsStepIndex(0);
    setIsPlayingBfs(false);
    setSearchStep(0);
    setIsPlayingSearch(false);
  }, [initialState, goalState]);

  // Human Play Timer
  useEffect(() => {
    let interval = null;
    const isAtGoal = isGoal(boardState, goalState);
    if (userTimerActive && !isAtGoal && mode === 'play') {
      interval = setInterval(() => {
        setUserTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [userTimerActive, boardState, mode]);

  // BFS Animated Playback Interval
  useEffect(() => {
    if (isPlayingBfs && mode === 'bfs' && bfsResult && bfsResult.solved) {
      const intervalMs = Math.max(120, Math.floor(750 / playbackSpeed));
      bfsTimerRef.current = setInterval(() => {
        setBfsStepIndex((prev) => {
          if (prev >= bfsResult.moves.length) {
            setIsPlayingBfs(false);
            confetti({ particleCount: 60, spread: 65, origin: { y: 0.6 } });
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (bfsTimerRef.current) clearInterval(bfsTimerRef.current);
    }

    return () => {
      if (bfsTimerRef.current) clearInterval(bfsTimerRef.current);
    };
  }, [isPlayingBfs, mode, bfsResult, playbackSpeed]);

  // Live search replay: auto-advance through the BFS expansion steps
  useEffect(() => {
    if (!isPlayingSearch) return undefined;
    const total = bfsResult?.snapshots?.length ?? 0;
    if (searchStep >= total - 1) {
      setIsPlayingSearch(false);
      return undefined;
    }
    const id = setTimeout(
      () => setSearchStep((v) => v + 1),
      Math.max(80, Math.floor(600 / playbackSpeed))
    );
    return () => clearTimeout(id);
  }, [isPlayingSearch, searchStep, bfsResult, playbackSpeed]);

  /**
   * Tile click handler (interactive sliding)
   */
  const handleTileClick = (tileIdx) => {
    const blankIdx = getBlankIndex(boardState);
    const validMoves = getValidMoves(boardState);

    // Find move where blank swaps with clicked tile
    const matched = validMoves.find(
      (m) => getBlankIndex(m.nextState) === tileIdx
    );

    if (!matched) return;

    const next = [...matched.nextState];

    if (mode === 'setup') {
      // Modifies the initial state directly
      setBoardState(next);
      setInitialState(next);
      setCustomInputText(next.join(' '));
      setUserLastMovedTile(matched.movedTile);
      setUserLastAction(matched.action);
    } else if (mode === 'play') {
      // User solves it themselves: every move counts as 1
      if (!userTimerActive) setUserTimerActive(true);
      setBoardState(next);
      setUserMovesCount((c) => c + 1);
      setUserLastMovedTile(matched.movedTile);
      setUserLastAction(matched.action);

      if (isGoal(next, goalState)) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    }
  };

  const handleResetPlay = () => {
    setBoardState([...initialState]);
    setUserMovesCount(0);
    setUserTimerSeconds(0);
    setUserTimerActive(false);
    setUserLastMovedTile(null);
    setUserLastAction(null);
  };

  const isSolvableCurrent = isSolvable(initialState, goalState);

  // The selected way of creating the puzzle is shown in red; the others stay white
  const activeSource = showCustomInput ? 'custom' : puzzleSource;
  const sourceBtnClass = (active) =>
    `inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
      active
        ? 'bg-[#ee2b47] border-[#ee2b47] text-white shadow-xs'
        : 'bg-white border-slate-200 text-[#0f172a] hover:bg-[#fff1f3]'
    }`;
  const isCurrentlyAtGoal = isGoal(boardState, goalState);
  const initialInversions = countInversions(initialState);

  // Derive board state for display
  let displayBoard = boardState;
  let displayMovedTile = userLastMovedTile;
  let displayAction = userLastAction;

  if (mode === 'bfs' && bfsResult && bfsResult.solved) {
    if (bfsStepIndex === 0) {
      displayBoard = initialState;
      displayMovedTile = null;
      displayAction = null;
    } else {
      const step = bfsResult.moves[bfsStepIndex - 1];
      if (step) {
        displayBoard = step.state;
        displayMovedTile = step.movedTile;
        displayAction = step.action;
      }
    }
  }

  // Snapshot of the BFS search at the current replay step (one per expansion)
  const searchSnaps = bfsResult?.snapshots ?? [];
  const activeSearch =
    searchSnaps.length > 0
      ? searchSnaps[Math.min(searchStep, searchSnaps.length - 1)]
      : undefined;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Top Header & Setup Bar (Summer Fruit Watermelon & Lime Palette) */}
      <div className="bg-gradient-to-r from-[#fff1f3] via-white to-[#f7fee7] border border-[#fecdd3] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Description */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold font-display text-[#0f172a]">
              Puzzle Solver
            </h1>
          </div>
          <p className="text-xs text-[#64748b]">
            Solve manually (step-by-step) or run AI Breadth-First Search for optimal solution
          </p>
        </div>

        {/* Right: Quick Actions for Randomize & Custom Input */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Prominent Randomize Button (Bright Watermelon Red) */}
          <button
            onClick={handleRandomize}
            className={sourceBtnClass(activeSource === 'random')}
            title="Generate a random solvable puzzle by moving tiles from goal"
          >
            <Dices className="w-4 h-4" />
            <span>Randomize</span>
          </button>

          {/* User Input Custom Start State Button */}
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={sourceBtnClass(activeSource === 'custom')}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Enter State Yourself</span>
          </button>

          {/* Preset Benchmark */}
          <button
            onClick={handleLoadBookBenchmark}
            className={sourceBtnClass(activeSource === 'benchmark')}
            title="Load assignment book example: 2 8 3 1 6 4 7 _ 5"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Benchmark</span>
          </button>

          {/* Solvability Status (Refreshing Lime Green) */}
          {isSolvableCurrent ? (
            <div className="flex items-center gap-1.5 text-[#365314] bg-[#ecfccb] px-3 py-1.5 rounded-xl border border-[#bef264] font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#65a30d]" />
              <span>Solvable</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#9f1239] bg-[#fff1f3] px-3 py-1.5 rounded-xl border border-[#fecdd3] font-bold text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ee2b47]" />
              <span>Unsolvable!</span>
              <button
                onClick={handleAutoFixParity}
                className="underline text-[#ee2b47] font-bold ml-1 cursor-pointer"
              >
                Auto-Fix
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Expandable User Start State Input Drawer */}
      {showCustomInput && (
        <div className="bg-white border-2 border-[#ee2b47]/30 rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1e232a]">
              <Edit3 className="w-4 h-4 text-[#ee2b47]" />
              <span>Enter Initial State & Goal State</span>
            </div>
            <span className="text-xs text-[#65a30d] font-bold font-mono">
              Current Goal: {goalState.map((n) => (n === 0 ? '_' : n)).join(' ')}
            </span>
          </div>

          <p className="text-xs text-[#475569] leading-relaxed">
            Enter the 9 numbers (0 to 8, where <strong>0</strong> or <strong>_</strong> represents the blank space) separated by spaces, row by row. Example: <span className="font-mono">2 8 3 1 6 4 7 _ 5</span>
          </p>

          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="w-full space-y-1">
              <label className="block text-[11px] font-bold text-[#475569]">Initial State</label>
              <input
                type="text"
                value={customInputText}
                onChange={(e) => setCustomInputText(e.target.value)}
                placeholder="2 8 3 1 6 4 7 0 5"
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#ee2b47] rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-[#1e232a] focus:outline-none"
              />
            </div>
            <div className="w-full space-y-1">
              <label className="block text-[11px] font-bold text-[#475569]">Goal State</label>
              <input
                type="text"
                value={customGoalText}
                onChange={(e) => setCustomGoalText(e.target.value)}
                placeholder="1 2 3 8 0 4 7 6 5"
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-[#65a30d] rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-[#1e232a] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleApplyCustomState}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#ee2b47] hover:bg-[#d81b36] text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setMode('setup');
                  setPuzzleSource('custom');
                  setShowCustomInput(false);
                }}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#1e232a] text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer border border-slate-200"
                title="Arrange by directly sliding tiles on the board"
              >
                Or Slide Tiles
              </button>
            </div>
          </div>

          {customInputError && (
            <div className="text-xs text-[#9f1239] bg-[#fff1f3] border border-[#fecdd3] px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ee2b47] shrink-0" />
              <span>{customInputError}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Central Clean Play / Solve Stage */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-between space-y-6">
        {/* Mode Selector Segmented Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              setMode('play');
              setIsPlayingBfs(false);
              setBoardState([...initialState]);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'play'
                ? 'bg-white text-[#ee2b47] shadow-xs ring-1 ring-slate-200'
                : 'text-[#475569] hover:text-[#1e232a]'
            }`}
          >
            <Hand className="w-4 h-4 text-[#ee2b47]" />
            <span>1. Solve It Yourself (Every move = 1)</span>
          </button>

          <button
            onClick={() => {
              setMode('bfs');
              setBfsStepIndex(0);
              setIsPlayingBfs(true);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'bfs'
                ? 'bg-[#ee2b47] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#1e232a]'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>2. Solve with BFS Algorithm (AI)</span>
          </button>
        </div>

        {/* Dynamic Status Banner */}
        <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2 text-xs text-[#475569]">
          <div>
            {mode === 'play' ? (
              <span className="font-semibold text-[#1e232a]">
                Your Moves:{' '}
                <strong className="text-xl font-bold font-mono text-[#ee2b47]">
                  {userMovesCount}
                </strong>{' '}
                <span className="text-[#64748b] font-normal">
                  (Click any tile next to the blank to slide)
                </span>
              </span>
            ) : mode === 'bfs' ? (
              <span className="font-semibold text-[#1e232a]">
                BFS Step{' '}
                <strong className="text-[#ee2b47] font-mono text-sm">
                  {bfsStepIndex}
                </strong>{' '}
                of {bfsResult?.moves.length ?? 0} moves
              </span>
            ) : (
              <span className="font-bold text-[#ee2b47]">
                Setup Mode: Slide tiles to create initial state
              </span>
            )}
          </div>

          <div>
            {isCurrentlyAtGoal ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ecfccb] text-[#365314] border border-[#84cc16] rounded-lg font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#65a30d]" />
                <span>Goal Reached!</span>
              </div>
            ) : mode === 'play' ? (
              <div className="inline-flex items-center gap-1.5 font-mono text-[#1e232a]">
                <Clock className="w-3.5 h-3.5 text-[#65a30d]" />
                <span>
                  {Math.floor(userTimerSeconds / 60)}:
                  {(userTimerSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* The 3 Boards: Initial State · Main Board · Goal State */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-2">
          {/* Initial State Mini Board */}
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-xs font-bold text-[#64748b]">Initial State</span>
            <MiniBoard state={initialState} size="sm" />
          </div>

          {/* Main 3x3 Puzzle Board (Anchored by Charcoal) */}
          <div className="flex flex-col items-center">
            <PuzzleBoard
              state={displayBoard}
              goalState={goalState}
              onTileClick={handleTileClick}
              lastMovedTile={displayMovedTile}
              lastAction={displayAction}
              size="lg"
              interactive={mode === 'play' || mode === 'setup'}
              interactiveHelpText={
                mode === 'play'
                  ? 'Click tile adjacent to blank to slide'
                  : mode === 'setup'
                  ? 'Click tiles to arrange initial state'
                  : undefined
              }
            />
          </div>

          {/* Target Goal Mini Board */}
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-xs font-bold text-[#365314]">Target Goal</span>
            <MiniBoard state={goalState} size="sm" isGoal />
          </div>
        </div>

        {/* Controls Deck */}
        {mode === 'bfs' ? (
          /* BFS Playback Deck */
          <div className="w-full max-w-lg space-y-3 pt-3 border-t border-slate-100">
            {/* Timeline Slider */}
            <div className="flex items-center justify-between text-xs text-[#64748b] font-mono">
              <span>Start</span>
              <span className="text-[#ee2b47] font-bold">
                {bfsStepIndex === 0
                  ? 'Step 0 (Initial)'
                  : `Move ${bfsStepIndex}: Blank ${displayAction}`}
              </span>
              <span>Goal ({bfsResult?.moves.length ?? 0} moves)</span>
            </div>

            <input
              type="range"
              min={0}
              max={bfsResult?.moves.length ?? 0}
              value={bfsStepIndex}
              onChange={(e) => {
                setIsPlayingBfs(false);
                setBfsStepIndex(parseInt(e.target.value));
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ee2b47]"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsPlayingBfs(false);
                    setBfsStepIndex(0);
                  }}
                  title="Reset to Step 0"
                  className="p-2 text-[#475569] hover:text-[#1e232a] hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsPlayingBfs(false);
                    setBfsStepIndex((p) => Math.max(0, p - 1));
                  }}
                  disabled={bfsStepIndex === 0}
                  title="Previous Step"
                  className="p-2 text-[#475569] hover:text-[#1e232a] hover:bg-white disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (isPlayingBfs) {
                      setIsPlayingBfs(false);
                    } else {
                      if (bfsStepIndex >= (bfsResult?.moves.length ?? 0)) {
                        setBfsStepIndex(0);
                      }
                      setIsPlayingBfs(true);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ee2b47] hover:bg-[#d81b36] text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {isPlayingBfs ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlayingBfs ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsPlayingBfs(false);
                    setBfsStepIndex((p) =>
                      Math.min(bfsResult?.moves.length ?? 0, p + 1)
                    );
                  }}
                  disabled={bfsStepIndex >= (bfsResult?.moves.length ?? 0)}
                  title="Next Step"
                  className="p-2 text-[#475569] hover:text-[#1e232a] hover:bg-white disabled:opacity-30 rounded-lg transition-colors cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Speed multiplier */}
              <div className="flex items-center gap-1.5 text-xs text-[#475569] font-mono">
                <span className="text-[11px] font-sans font-medium">Speed:</span>
                {[0.5, 1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                      playbackSpeed === s
                        ? 'bg-[#ee2b47] text-white'
                        : 'bg-white border border-slate-200 text-[#1e232a] hover:bg-slate-100'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
            {/* Dropdown: every state from the initial state to the goal */}
            {bfsResult && bfsResult.solved && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowSolutionStates((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white hover:bg-[#fff1f3] text-xs font-bold text-[#0f172a] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-[#ee2b47]" />
                    <span>
                      All states from start to goal ({bfsResult.path.length} states, {bfsResult.moves.length} moves)
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#64748b] transition-transform ${
                      showSolutionStates ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showSolutionStates && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border-t border-slate-200 max-h-80 overflow-y-auto">
                    {bfsResult.path.map((node, i) => {
                      const isLast = i === bfsResult.path.length - 1;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setIsPlayingBfs(false);
                            setBfsStepIndex(i);
                          }}
                          title={`Jump to step ${i}`}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center cursor-pointer transition-colors ${
                            bfsStepIndex === i
                              ? 'border-[#ee2b47] bg-[#fff1f3]'
                              : 'border-slate-200 bg-white hover:bg-[#fff1f3]'
                          }`}
                        >
                          <span className="text-[10px] font-mono font-bold text-[#475569] leading-tight">
                            {i === 0 ? 'Step 0 (Initial)' : `Step ${i}: ${node.action}`}
                            {isLast && i !== 0 ? ' (Goal)' : ''}
                          </span>
                          <MiniBoard state={node.state} goalState={goalState} size="xs" isGoal={isLast} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Human Play Deck */
          <div className="w-full flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              onClick={handleResetPlay}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#1e232a] font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Moves</span>
            </button>

            <button
              disabled={!bfsResult?.solved}
              onClick={() => {
                setMode('bfs');
                setBfsStepIndex(0);
                setIsPlayingBfs(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#ee2b47] hover:bg-[#d81b36] text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer disabled:bg-slate-300 disabled:hover:bg-slate-300 disabled:cursor-not-allowed"
            >
              <Bot className="w-4 h-4" />
              <span>
                {bfsResult?.solved
                  ? `Watch BFS Solve (${bfsResult.moves.length} moves)`
                  : 'No BFS solution for this puzzle'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Streamlined Details Section: Clean Tabs for BFS Stats & Move Sequence */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Tab Headers */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInspectorTab('search')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                inspectorTab === 'search'
                  ? 'bg-[#ee2b47] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1e232a] hover:bg-slate-100'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Live Search Process</span>
            </button>

            <button
              onClick={() => setInspectorTab('metrics')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                inspectorTab === 'metrics'
                  ? 'bg-[#ee2b47] text-white shadow-xs'
                  : 'text-[#475569] hover:text-[#1e232a] hover:bg-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Solution Summary & Statistics</span>
            </button>

            <button
              onClick={() => setInspectorTab('steps')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                inspectorTab === 'steps'
                  ? 'bg-[#84cc16] text-[#14532d] shadow-xs'
                  : 'text-[#475569] hover:text-[#0f172a] hover:bg-slate-100'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Solution Steps Walkthrough ({bfsResult?.moves.length ?? 0})</span>
            </button>
          </div>

          <button
            onClick={onGoToComparison}
            className="text-xs font-bold text-[#ee2b47] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Compare with DFS, A*, etc.</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Content 0: Live Search Process (current node, parent, successors, frontier, explored) */}
        {inspectorTab === 'search' && (
          <div className="space-y-4">
            {!activeSearch ? (
              <p className="text-xs text-[#64748b] py-6 text-center">
                {bfsResult?.solved
                  ? 'The initial state is already the goal, so BFS needed no search steps.'
                  : 'BFS found no solution for this puzzle, so there are no search steps to replay.'}
              </p>
            ) : (
              <>
                {/* Replay controls */}
                <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <button
                    onClick={() => {
                      setIsPlayingSearch(false);
                      setSearchStep(0);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-[#0f172a] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPlayingSearch(false);
                      setSearchStep((v) => Math.max(0, v - 1));
                    }}
                    disabled={searchStep === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-[#0f172a] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                    <span>Previous Step</span>
                  </button>
                  <button
                    onClick={() => {
                      if (isPlayingSearch) {
                        setIsPlayingSearch(false);
                      } else {
                        if (searchStep >= searchSnaps.length - 1) setSearchStep(0);
                        setIsPlayingSearch(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#ee2b47] hover:bg-[#d81b36] text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                  >
                    {isPlayingSearch ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlayingSearch ? 'Pause' : 'Run'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsPlayingSearch(false);
                      setSearchStep((v) => Math.min(searchSnaps.length - 1, v + 1));
                    }}
                    disabled={searchStep >= searchSnaps.length - 1}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-bold text-[#0f172a] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Next Step</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={searchSnaps.length - 1}
                    value={Math.min(searchStep, searchSnaps.length - 1)}
                    onChange={(e) => {
                      setIsPlayingSearch(false);
                      setSearchStep(Number(e.target.value));
                    }}
                    aria-label="Search step"
                    className="flex-1 min-w-[120px] accent-[#ee2b47]"
                  />
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    aria-label="Replay speed"
                    className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#0f172a] cursor-pointer"
                  >
                    {[0.5, 1, 2, 4].map((sp) => (
                      <option key={sp} value={sp}>
                        {sp}x
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono font-bold text-[#475569]">
                  <span>
                    Expanding node #{activeSearch.expansionNumber.toLocaleString()} (replay step{' '}
                    {Math.min(searchStep, searchSnaps.length - 1) + 1} of {searchSnaps.length})
                  </span>
                  {bfsResult.nodesExpanded > searchSnaps.length && (
                    <span className="font-sans font-medium text-[#64748b]">
                      BFS expanded {bfsResult.nodesExpanded.toLocaleString()} nodes in total. The replay shows the
                      first {MAX_SEARCH_SNAPSHOTS} expansions and the final step that reaches the goal.
                    </span>
                  )}
                </div>

                {/* Live counters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  {[
                    ['Current Depth', activeSearch.currentDepth],
                    ['Path Cost g(n)', activeSearch.currentNode.g],
                    ['Nodes Generated', activeSearch.generatedSoFar],
                    ['Nodes Expanded', activeSearch.expansionNumber],
                    ['Frontier Size', activeSearch.frontierSize],
                    ['Explored Size', activeSearch.exploredSize],
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[11px] text-[#64748b] block font-medium">{label}</span>
                      <span className="text-lg font-bold font-mono text-[#1e232a] mt-0.5 block">
                        {Number(value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[#64748b] -mt-2">
                  BFS is uninformed, so there is no heuristic: h(n) = 0 and f(n) = g(n) = depth.
                </p>

                {/* Current node and its parent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-[#fecdd3] bg-[#fff1f3] flex items-center gap-4">
                    <MiniBoard state={activeSearch.currentNode.state} goalState={goalState} size="sm" />
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-[#ee2b47]">Current node being expanded</div>
                      <div className="text-[#475569]">
                        Depth {activeSearch.currentDepth}
                        {activeSearch.currentNode.action
                          ? `, reached by moving the blank ${activeSearch.currentNode.action}`
                          : ', the root (initial state)'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-4">
                    {activeSearch.currentNode.parentState ? (
                      <MiniBoard state={activeSearch.currentNode.parentState} size="sm" />
                    ) : (
                      <div className="w-24 h-24 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-[11px] text-[#94a3b8]">
                        none
                      </div>
                    )}
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-[#0f172a]">Parent node</div>
                      <div className="text-[#475569]">
                        {activeSearch.currentNode.parentState
                          ? 'The node that generated the current node'
                          : 'None, the current node is the root'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Successor states generated from the current node */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1e232a] block">
                    Generated successor states (blank moves):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {['UP', 'DOWN', 'LEFT', 'RIGHT'].map((dir) => {
                      const succ = activeSearch.successors.find((x) => x.action === dir);
                      return (
                        <div
                          key={dir}
                          className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-between min-h-[95px] ${
                            succ
                              ? succ.status === 'goal'
                                ? 'bg-[#ecfccb] border-[#84cc16]'
                                : succ.status === 'enqueued'
                                ? 'bg-[#fff1f3] border-[#fecdd3]'
                                : 'bg-slate-50 border-slate-200 opacity-60'
                              : 'bg-slate-50/50 border-slate-100 opacity-40'
                          }`}
                        >
                          <span className="text-[11px] font-mono font-bold text-[#1e232a]">{dir}</span>
                          {succ ? (
                            <>
                              <div className="my-1">
                                <MiniBoard state={succ.state} size="xs" />
                              </div>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                                  succ.status === 'goal'
                                    ? 'bg-[#84cc16] text-white'
                                    : succ.status === 'enqueued'
                                    ? 'bg-[#ee2b47] text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {succ.status === 'goal'
                                  ? 'Goal Reached'
                                  : succ.status === 'enqueued'
                                  ? 'Added to frontier'
                                  : 'Already visited'}
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-[#94a3b8] my-auto">Invalid move</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Frontier (open list) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1e232a] block">
                    Frontier / Open List (FIFO queue): {activeSearch.frontierSize.toLocaleString()} nodes
                    <span className="font-medium text-[#64748b]"> (next to be expanded is on the left)</span>
                  </span>
                  <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
                    {activeSearch.frontierQueueSample.length === 0 && (
                      <span className="text-[11px] text-[#94a3b8] py-3">The frontier is empty.</span>
                    )}
                    {activeSearch.frontierQueueSample.map((n, i) => (
                      <div
                        key={i}
                        className={`shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border ${
                          i === 0 ? 'border-[#ee2b47] bg-[#fff1f3]' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <MiniBoard state={n.state} size="xs" />
                        <span className="text-[9px] font-mono font-bold text-[#64748b]">
                          {i === 0 ? 'front, ' : ''}depth {n.depth}
                        </span>
                      </div>
                    ))}
                    {activeSearch.frontierSize > activeSearch.frontierQueueSample.length && (
                      <span className="shrink-0 self-center px-2 text-[11px] font-mono font-bold text-[#64748b]">
                        + {(activeSearch.frontierSize - activeSearch.frontierQueueSample.length).toLocaleString()} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Explored (closed list) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1e232a] block">
                    Explored / Closed List: {activeSearch.exploredSize.toLocaleString()} nodes
                    <span className="font-medium text-[#64748b]"> (most recently expanded on the left)</span>
                  </span>
                  <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
                    {activeSearch.exploredRecent.map((st, i) => (
                      <div
                        key={i}
                        className="shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <MiniBoard state={st} size="xs" />
                      </div>
                    ))}
                    {activeSearch.exploredSize > activeSearch.exploredRecent.length && (
                      <span className="shrink-0 self-center px-2 text-[11px] font-mono font-bold text-[#64748b]">
                        + {(activeSearch.exploredSize - activeSearch.exploredRecent.length).toLocaleString()} earlier
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab Content 1: Solution Summary & Statistics */}
        {inspectorTab === 'metrics' && (
          <div className="space-y-4">
            {/* 6 Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] text-[#64748b] block font-medium">Optimal Moves</span>
                <span className="text-xl font-bold font-mono text-[#ee2b47] mt-0.5 block">
                  {bfsResult?.solved ? bfsResult.cost : '--'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] text-[#64748b] block font-medium">Nodes Expanded</span>
                <span className="text-xl font-bold font-mono text-[#65a30d] mt-0.5 block">
                  {bfsResult?.nodesExpanded.toLocaleString() ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] text-[#64748b] block font-medium">Nodes Generated</span>
                <span className="text-xl font-bold font-mono text-[#1e232a] mt-0.5 block">
                  {bfsResult?.nodesGenerated.toLocaleString() ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] text-[#64748b] block font-medium">Execution Time</span>
                <span className="text-xl font-bold font-mono text-[#1e232a] mt-0.5 block">
                  {bfsResult ? `${bfsResult.executionTimeMs.toFixed(1)} ms` : '--'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] text-[#64748b] block font-medium">Max Depth</span>
                <span className="text-xl font-bold font-mono text-[#1e232a] mt-0.5 block">
                  {bfsResult?.maxDepth ?? 0}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] text-[#64748b] block font-medium">Memory (Approx)</span>
                <span className="text-xl font-bold font-mono text-[#b45309] mt-0.5 block">
                  {bfsResult ? `${bfsResult.approxMemoryKb} KB` : '--'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Move by Move Sequence */}
        {inspectorTab === 'steps' && (
          <div className="space-y-2">
            {bfsResult && bfsResult.solved ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {bfsResult.moves.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMode('bfs');
                      setBfsStepIndex(idx + 1);
                      setIsPlayingBfs(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-left font-mono text-xs transition-colors cursor-pointer ${
                      bfsStepIndex === idx + 1 && mode === 'bfs'
                        ? 'bg-[#ee2b47] text-white font-bold shadow-xs'
                        : 'bg-slate-50 text-[#1e232a] hover:bg-[#fff1f3] border border-slate-200'
                    }`}
                  >
                    <span>
                      Step {idx + 1}: Blank{' '}
                      <strong className={bfsStepIndex === idx + 1 && mode === 'bfs' ? 'text-white' : 'text-[#ee2b47]'}>
                        {m.action}
                      </strong>
                    </span>
                    <span className="text-[11px] opacity-75 font-sans">
                      (Tile {m.movedTile})
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#64748b] font-mono">
                No solution path available.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
