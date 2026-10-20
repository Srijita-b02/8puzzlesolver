/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * MiniBoard 3x3 component for previews and successor branches
 * Pure JavaScript (ES6 React JSX)
 */
export const MiniBoard = ({
  state,
  goalState,
  size = 'sm',
  highlightAction,
  isGoal = false,
}) => {
  const sizeClasses = {
    xs: 'w-16 h-16 p-1 gap-0.5 text-[10px]',
    sm: 'w-24 h-24 p-1.5 gap-1 text-xs',
    md: 'w-32 h-32 p-2 gap-1.5 text-sm',
  }[size];

  return (
    <div
      className={`grid grid-cols-3 bg-slate-100/90 rounded-lg border ${
        isGoal ? 'border-[#84cc16] ring-2 ring-[#bef264]/40' : 'border-slate-300'
      } ${sizeClasses} relative shadow-xs`}
    >
      {state.map((val, idx) => {
        const isBlank = val === 0;
        const matchesGoal = goalState && !isBlank && goalState[idx] === val;

        if (isBlank) {
          return (
            <div
              key={idx}
              className="bg-white/80 rounded flex items-center justify-center border border-dashed border-slate-300"
            >
              <span className="opacity-0">0</span>
            </div>
          );
        }

        return (
          <div
            key={idx}
            className={`rounded flex items-center justify-center font-mono font-bold transition-colors ${
              matchesGoal
                ? 'bg-[#ecfccb] text-[#365314] border border-[#84cc16]'
                : 'bg-white text-[#0f172a] border border-slate-200 shadow-2xs'
            }`}
          >
            {val}
          </div>
        );
      })}

      {highlightAction && (
        <div className="absolute -bottom-2 -right-1 bg-white border border-[#ee2b47]/40 text-[9px] font-mono font-bold text-[#ee2b47] px-1 py-0.2 rounded shadow-xs">
          {highlightAction}
        </div>
      )}
    </div>
  );
};
