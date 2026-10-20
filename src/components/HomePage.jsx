/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MiniBoard } from './MiniBoard.jsx';
import { PRESETS } from '../utils/puzzleUtils.js';
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Brain,
} from 'lucide-react';

/**
 * Home page component displaying course metadata, 8-puzzle introduction, and interactive shortcuts
 * Pure JavaScript (ES6 React JSX)
 */
export const HomePage = ({
  studentInfo,
  onNavigate,
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Assignment Header Card: fills the screen, the two boxes below appear on scroll */}
      <div className="bg-gradient-to-br from-[#fff1f3] via-white to-[#f7fee7] border border-[#fecdd3] rounded-3xl p-8 sm:p-14 shadow-xs space-y-7 min-h-[calc(100vh_-_7rem)] flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-mono text-[#ee2b47] font-bold">
          
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl leading-tight font-extrabold font-display text-[#0f172a] tracking-tight">
          {studentInfo.assignmentTitle}
        </h1>

        <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-3xl">
          An interactive web application solving the 8 Puzzle Problem using <strong>Breadth First Search (BFS)</strong>. Create initial states by typing numbers or sliding tiles, click <strong>Randomize</strong> for instant solvable puzzles, solve the puzzle step-by-step yourself, or watch the AI solve it using BFS with animated movements and search metrics.
        </p>

        {/* Quick Actions with Watermelon Red and Refreshing Lime */}
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <button
            onClick={() => onNavigate('solver')}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#ee2b47] hover:bg-[#d81b36] text-white font-bold text-sm rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <span>Open Puzzle Solver</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate('comparison')}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-[#0f172a] text-sm font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-5 h-5 text-[#ee2b47]" />
            <span>View Algorithm Comparison Table</span>
          </button>
          <button
            onClick={() => onNavigate('theory')}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-[#0f172a] text-sm font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <BookOpen className="w-5 h-5 text-[#65a30d]" />
            <span>BFS Theory & Complexity</span>
          </button>
        </div>
      </div>

      {/* Introduction to the 8-Puzzle Problem */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Problem Formulation (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#ee2b47]" />
            <span>Introduction to the 8-Puzzle Problem</span>
          </h2>

          <p className="text-xs text-[#475569] leading-relaxed">
            The 8-Puzzle consists of a 3×3 grid with 8 numbered tiles (1 to 8) and an empty space (represented by blank or 0). A tile adjacent to the blank space can slide horizontally or vertically into the empty space.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-[#0f172a]">1. State Space</span>
              <p className="text-[#64748b] leading-snug">
                Any permutation of the 9 positions (8 numbered tiles + 1 blank). 9! / 2 = 181,440 solvable states.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-[#0f172a]">2. Allowed Actions</span>
              <p className="text-[#64748b] leading-snug">
                Move blank UP, DOWN, LEFT, or RIGHT (sliding adjacent numbered tile).
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-[#0f172a]">3. Path Cost</span>
              <p className="text-[#64748b] leading-snug">
                Each move costs exactly 1. Total cost equals the total number of tile moves.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-[#0f172a]">4. BFS Optimality</span>
              <p className="text-[#64748b] leading-snug">
                Because all move costs are equal (1), Breadth First Search (BFS) is provably guaranteed to find the shortest possible solution path.
              </p>
            </div>
          </div>
        </div>

        {/* Assignment Benchmark Box (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#0f172a] border-b border-slate-100 pb-2">
              Assignment Document Example
            </h3>
            <p className="text-xs text-[#64748b] mt-2 leading-relaxed">
              The benchmark puzzle configuration from the problem statement:
            </p>
          </div>

          <div className="flex items-center justify-around gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-xs font-bold text-[#64748b]">Initial State</span>
              <MiniBoard state={PRESETS.BOOK_EXAMPLE.initial} size="sm" />
            </div>

            <div className="text-[#ee2b47] font-mono text-xs flex flex-col items-center gap-1 font-bold">
              <ArrowRight className="w-5 h-5" />
              <span>BFS Solves</span>
            </div>

            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-xs font-bold text-[#365314]">Goal State</span>
              <MiniBoard state={PRESETS.BOOK_EXAMPLE.goal} size="sm" isGoal />
            </div>
          </div>

          <button
            onClick={() => onNavigate('solver')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ee2b47] hover:bg-[#d81b36] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <span>Load Benchmark into Solver</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
