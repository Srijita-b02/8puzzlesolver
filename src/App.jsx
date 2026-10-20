/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PRESETS } from './utils/puzzleUtils';
import { STUDENT_INFO } from './studentInfo';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { MainBfsSolver } from './components/MainBfsSolver';
import { ComparisonPage } from './components/ComparisonPage';
import { AlgorithmInfoPage } from './components/AlgorithmInfoPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  // Puzzle configuration is kept here so the Solver page and the Comparison page share it
  const [initialState, setInitialState] = useState([...PRESETS.BOOK_EXAMPLE.initial]);
  const [goalState, setGoalState] = useState([...PRESETS.BOOK_EXAMPLE.goal]);

  // Permanent student details (read-only, defined in src/studentInfo.js)
  const studentInfo = STUDENT_INFO;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#0f172a] flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentInfo={studentInfo}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tab 1: Home Page */}
        {activeTab === 'home' && (
          <HomePage
            studentInfo={studentInfo}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* Tab 2: The 8-Puzzle Solver & Interactive Board */}
        {activeTab === 'solver' && (
          <MainBfsSolver
            initialState={initialState}
            setInitialState={setInitialState}
            goalState={goalState}
            setGoalState={setGoalState}
            onGoToComparison={() => setActiveTab('comparison')}
          />
        )}

        {/* Tab 3: Algorithm Performance Comparison */}
        {activeTab === 'comparison' && (
          <ComparisonPage
            initialState={initialState}
            goalState={goalState}
          />
        )}

        {/* Tab 4: Algorithm Theory & Complexity */}
        {activeTab === 'theory' && (
          <AlgorithmInfoPage />
        )}
      </main>

      {/* Summer Fruit Footer */}
      <footer className="border-t border-[#fecdd3] bg-white py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748b]">
          <div>
            <span>{studentInfo.courseName}</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>{studentInfo.assignmentTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Name: {studentInfo.studentName}</span>
            <span aria-hidden="true">·</span>
            <span>Assigned: {studentInfo.assignedAlgorithm}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
