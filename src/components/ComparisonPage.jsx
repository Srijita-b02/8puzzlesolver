/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { runBenchmarkSuite } from '../algorithms/solverRunner';
import { MiniBoard } from './MiniBoard';
import { Play, CheckCircle2, XCircle, BarChart2, RefreshCw } from 'lucide-react';

export const ComparisonPage = ({
  initialState,
  goalState,
}) => {
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const runBenchmarks = () => {
    setIsRunning(true);
    setTimeout(() => {
      const benchResults = runBenchmarkSuite(initialState, goalState);
      setResults(benchResults);
      setIsRunning(false);
    }, 20);
  };

  useEffect(() => {
    runBenchmarks();
  }, [initialState, goalState]);

  const maxExpanded = Math.max(1, ...results.map((r) => (r.solved ? r.nodesExpanded : 0)));
  const maxTime = Math.max(1, ...results.map((r) => r.timeMs));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Benchmark Trigger (Summer Fruit Palette) */}
      <div className="bg-gradient-to-r from-[#fff1f3] via-white to-[#f7fee7] border border-[#fecdd3] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#ee2b47]" />
            <span>Algorithm Performance Comparison</span>
          </h2>
          <p className="text-xs text-[#64748b] mt-1">
            Empirical benchmark comparing BFS with DFS, DLS, IDDLS, GBFS, and A* on the current puzzle configuration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runBenchmarks}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#ee2b47] hover:bg-[#d81b36] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isRunning ? 'Running All Algorithms...' : 'Re-Run Comparison'}</span>
          </button>
        </div>
      </div>

      {/* Target Puzzle Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-[#64748b]">Benchmark Initial State:</span>
            <MiniBoard state={initialState} size="xs" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-[#365314]">Target Goal State:</span>
            <MiniBoard state={goalState} size="xs" isGoal />
          </div>
        </div>
        <div className="text-xs text-[#64748b] font-medium">
          Evaluated under identical starting conditions
        </div>
      </div>

      {/* Primary Benchmark Table as requested in Assignment Spec 7 */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[#1e232a] font-bold">
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4 text-center">Solution Found</th>
                <th className="py-3 px-4 text-right">Nodes Expanded</th>
                <th className="py-3 px-4 text-right">Nodes Generated</th>
                <th className="py-3 px-4 text-right">Moves</th>
                <th className="py-3 px-4 text-right">Time</th>
                <th className="py-3 px-4 text-right">Memory</th>
                <th className="py-3 px-4 text-center">Completeness</th>
                <th className="py-3 px-4 text-center">Optimality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {results.map((row, idx) => {
                const isBfs = row.algorithm === 'BFS';
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isBfs
                        ? 'bg-[#fff1f3] font-semibold'
                        : 'hover:bg-slate-50 text-[#1e232a]'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans text-[#1e232a]">
                      <div className="flex items-center gap-2">
                        <span>{row.name}</span>
                        {isBfs && (
                          <span className="text-[10px] font-mono font-bold text-[#ee2b47] bg-[#fecdd3] px-1.5 py-0.5 rounded">
                            Assigned (BFS)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {row.solved ? (
                        <span className="inline-flex items-center gap-1 text-[#365314] bg-[#ecfccb] px-2 py-0.5 rounded font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#65a30d]" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#9f1239] bg-[#fff1f3] px-2 py-0.5 rounded font-bold">
                          <XCircle className="w-3.5 h-3.5 text-[#ee2b47]" />
                          <span>No</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-[#1e232a]">
                      {row.nodesExpanded.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-[#64748b]">
                      {row.nodesGenerated.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-[#ee2b47] font-bold">
                      {row.solved ? row.movesCount : '--'}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-[#1e232a]">
                      {row.timeMs} ms
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-[#64748b]">
                      {row.memoryKb > 0 ? `${row.memoryKb} KB` : '< 1 KB'}
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      <span
                        className={`text-[11px] font-medium ${
                          row.completeness === 'Yes'
                            ? 'text-[#365314]'
                            : row.completeness === 'No'
                            ? 'text-[#9f1239]'
                            : 'text-[#b45309]'
                        }`}
                      >
                        {row.completeness}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      <span
                        className={`text-[11px] font-medium ${
                          row.optimality === 'Yes'
                            ? 'text-[#365314]'
                            : 'text-[#9f1239]'
                        }`}
                      >
                        {row.optimality}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Comparison Charts (Watermelon & Lime pops with Deep Charcoal base) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Nodes Expanded */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-[#1e232a]">
              Nodes Expanded (Search Space Explored)
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {results.map((r, i) => {
              const widthPct = Math.max(4, Math.round((r.nodesExpanded / maxExpanded) * 100));
              const isBfs = r.algorithm === 'BFS';

              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${isBfs ? 'text-[#ee2b47]' : 'text-[#475569]'}`}>
                      {r.name}
                    </span>
                    <span className="font-mono text-[#64748b]">
                      {r.nodesExpanded.toLocaleString()} nodes
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isBfs
                          ? 'bg-[#ee2b47]'
                          : r.algorithm === 'ASTAR'
                          ? 'bg-[#84cc16]' /* Lime Green for A* */
                          : 'bg-[#94a3b8]'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Execution Time */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-[#1e232a]">
              Execution Time (milliseconds)
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {results.map((r, i) => {
              const widthPct = Math.max(4, Math.round((r.timeMs / maxTime) * 100));
              const isBfs = r.algorithm === 'BFS';

              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${isBfs ? 'text-[#ee2b47]' : 'text-[#475569]'}`}>
                      {r.name}
                    </span>
                    <span className="font-mono text-[#64748b]">
                      {r.timeMs} ms
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isBfs ? 'bg-[#ee2b47]' : 'bg-[#94a3b8]'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
