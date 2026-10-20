/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getBlankIndex } from '../utils/puzzleUtils.js';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Interactive PuzzleBoard component with sliding cues and directional indicators
 * Pure JavaScript (ES6 React JSX)
 */
export const PuzzleBoard = ({
  state,
  goalState,
  onTileClick,
  lastMovedTile,
  lastAction,
  size = 'lg',
  interactive = false,
  interactiveHelpText,
}) => {
  const blankIdx = getBlankIndex(state);
  const blankRow = Math.floor(blankIdx / 3);
  const blankCol = blankIdx % 3;

  const boardSizeClass =
    size === 'lg'
      ? 'w-72 h-72 sm:w-84 sm:h-84 p-3 gap-2.5'
      : 'w-60 h-60 p-2.5 gap-2';
  const fontSizeClass = size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-2xl';

  return (
    <div className="flex flex-col items-center">
      {/* 3x3 Grid Board with clean, pleasant light slate frame */}
      <div
        className={`grid grid-cols-3 bg-slate-100/90 rounded-2xl border-2 border-slate-300 shadow-md relative select-none ${boardSizeClass}`}
      >
        {state.map((val, idx) => {
          const isBlank = val === 0;
          const row = Math.floor(idx / 3);
          const col = idx % 3;

          // Check if adjacent to blank (can move)
          const isAdjacent =
            (Math.abs(row - blankRow) === 1 && col === blankCol) ||
            (Math.abs(col - blankCol) === 1 && row === blankRow);

          const matchesGoal = goalState && !isBlank && goalState[idx] === val;
          const isJustMoved = lastMovedTile !== null && lastMovedTile === val;

          if (isBlank) {
            return (
              <div
                key={idx}
                className="bg-white/70 rounded-xl border border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden transition-all duration-200"
              >
                {/* Visual directional indicators inside the blank (Watermelon Red arrows) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
                  <div className="relative w-8 h-8">
                    {blankRow > 0 && (
                      <ArrowUp className="w-4 h-4 absolute top-0 left-1/2 -translate-x-1/2 text-[#ee2b47]" />
                    )}
                    {blankRow < 2 && (
                      <ArrowDown className="w-4 h-4 absolute bottom-0 left-1/2 -translate-x-1/2 text-[#ee2b47]" />
                    )}
                    {blankCol > 0 && (
                      <ArrowLeft className="w-4 h-4 absolute left-0 top-1/2 -translate-y-1/2 text-[#ee2b47]" />
                    )}
                    {blankCol < 2 && (
                      <ArrowRight className="w-4 h-4 absolute right-0 top-1/2 -translate-y-1/2 text-[#ee2b47]" />
                    )}
                  </div>
                </div>
                <span className="sr-only">Blank Tile</span>
              </div>
            );
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={!interactive || !isAdjacent}
              onClick={() => onTileClick && onTileClick(idx)}
              className={`rounded-xl flex items-center justify-center font-display font-extrabold ${fontSizeClass} transition-all duration-150 relative shadow-xs ${
                isJustMoved
                  ? 'bg-[#ee2b47] text-white ring-2 ring-[#ff6b81] scale-[1.02] shadow-sm'
                  : matchesGoal
                  ? 'bg-[#f7fee7] text-[#365314] border-2 border-[#84cc16] hover:border-[#65a30d]'
                  : 'bg-white text-[#0f172a] border-2 border-slate-200 hover:border-[#ee2b47]'
              } ${
                interactive && isAdjacent
                  ? 'cursor-pointer hover:border-[#ee2b47] hover:bg-[#fff5f6] hover:scale-[1.03] active:scale-[0.98]'
                  : interactive
                  ? 'cursor-default opacity-90'
                  : 'cursor-default'
              }`}
            >
              <span>{val}</span>

              {/* Goal indicator badge (Refreshing Lime Green) */}
              {matchesGoal && (
                <div
                  className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#84cc16] ring-2 ring-white"
                  title="Correct goal position"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Action Subtitle */}
      {interactiveHelpText ? (
        <div className="mt-2.5 text-xs text-[#64748b] font-medium">
          {interactiveHelpText}
        </div>
      ) : lastAction ? (
        <div className="mt-2.5 flex items-center gap-2 text-xs font-mono text-[#0f172a]">
          <span>Blank Moved:</span>
          <span className="px-2 py-0.5 bg-[#ecfccb] text-[#365314] border border-[#bef264] rounded font-bold">
            {lastAction}
          </span>
          {lastMovedTile !== null && (
            <span className="text-[#64748b]">
              (Tile {lastMovedTile} slid into blank)
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
};
