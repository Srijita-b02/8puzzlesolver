/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, BookOpen, Sparkles, X } from 'lucide-react';

/**
 * Top Bar navigation header component with student profile modal
 * Pure JavaScript (ES6 React JSX)
 */
export const Header = ({
  activeTab,
  setActiveTab,
  studentInfo,
}) => {
  const [showStudentModal, setShowStudentModal] = useState(false);

  return (
    <>
      <header className="border-b border-[#fecdd3] bg-white/95 backdrop-blur sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Brand Wordmark (Watermelon Red & Refreshing Lime) */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-[#0f172a] group-hover:text-[#ee2b47] transition-colors">
                8 Puzzle Solver
              </span>
            </div>
          </button>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 text-sm font-medium">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'home'
                  ? 'text-[#ee2b47] bg-[#fff1f3] font-bold'
                  : 'text-[#475569] hover:text-[#0f172a] hover:bg-slate-100'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('solver')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'solver'
                  ? 'text-[#ee2b47] bg-[#fff1f3] font-bold'
                  : 'text-[#475569] hover:text-[#0f172a] hover:bg-slate-100'
              }`}
            >
              <span>Puzzle Solver</span>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'comparison'
                  ? 'text-[#ee2b47] bg-[#fff1f3] font-bold'
                  : 'text-[#475569] hover:text-[#0f172a] hover:bg-slate-100'
              }`}
            >
              Algorithm Comparison
            </button>
            <button
              onClick={() => setActiveTab('theory')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'theory'
                  ? 'text-[#ee2b47] bg-[#fff1f3] font-bold'
                  : 'text-[#475569] hover:text-[#0f172a] hover:bg-slate-100'
              }`}
            >
              Algorithm Theory
            </button>
          </nav>

          {/* Student Profile Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStudentModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#0f172a] bg-[#fff1f3] hover:bg-[#ffe4e6] border border-[#fecdd3] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              title="View student details"
            >
              <User className="w-3.5 h-3.5 text-[#ee2b47]" />
              <span className="font-semibold text-[#0f172a]">{studentInfo.studentName}</span>
              <span className="hidden sm:inline text-[#65a30d] font-mono text-[11px] font-bold">
                ({studentInfo.registrationNumber})
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Student Profile Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#0f172a] font-semibold text-sm">
                <BookOpen className="w-4 h-4 text-[#ee2b47]" />
                <span>Student & Assignment Details</span>
              </div>
              <button
                onClick={() => setShowStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                ['Course Name', studentInfo.courseName],
                ['Assignment Title', studentInfo.assignmentTitle],
                ['Student Name', studentInfo.studentName],
                ['Registration Number', studentInfo.registrationNumber],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="font-medium text-[#475569] mb-1">{label}</div>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[#0f172a] text-xs font-semibold">
                    {value}
                  </div>
                </div>
              ))}

              {/* Watermelon & Lime Highlight Card */}
              <div className="p-3 bg-[#fff1f3] border border-[#fecdd3] rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[#ee2b47] font-bold">
                   
                  <span>Assigned Search Technique: {studentInfo.assignedAlgorithm}</span>
                </div>
                <p  className="text-[#64748b] text-[11px] leading-relaxed">
                  FIFO Queue based state space search · Explores level-by-level · Provably finds the optimal (shortest) move sequence for unit step costs.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowStudentModal(false)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#ee2b47] hover:bg-[#d81b36] rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
