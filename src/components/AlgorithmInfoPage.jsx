/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Check, AlertCircle, Sparkles } from 'lucide-react';

const ALGORITHMS_DATA = [
  {
    id: 'BFS',
    title: 'Breadth First Search (BFS)',
    category: 'Uninformed Search',
    description:
      'Breadth First Search is a state-space search strategy that expands the shallowest unexpanded node first, proceeding systematically level by level.',
    workingPrinciple:
      'BFS utilizes a First-In, First-Out (FIFO) Queue for its Frontier. Nodes at depth d are all expanded before any nodes at depth d + 1. An Explored Set (Closed List) prevents visiting the same board configuration multiple times. In an unweighted 8-puzzle where each tile move has cost = 1, the first time the goal state is encountered, the path is mathematically guaranteed to be the shortest possible move sequence.',
    queueType: 'FIFO Queue (First-In, First-Out)',
    timeComplexity: 'O(b^d) — where b is the branching factor (b ≤ 4) and d is solution depth',
    spaceComplexity: 'O(b^d) — Every node generated is retained in memory',
    completeness: 'Yes — Always finds a solution if one exists',
    optimality: 'Yes — Guaranteed shortest move path for unit step costs',
    advantages: [
      'Provably optimal solution path (minimum number of tile moves).',
      'Complete: guaranteed to reach the goal for any solvable 8-puzzle.',
      'Never trapped in infinite loops or deep dead-end branches.',
    ],
    limitations: [
      'Memory consumption grows exponentially with depth: O(b^d).',
      'Uninformed: treats all 4 movement directions equally without goal awareness.',
    ],
    pseudocode: `function BREADTH-FIRST-SEARCH(initial_state, goal_state):
    if initial_state == goal_state:
        return [initial_state]
    
    frontier = FIFO_Queue()
    frontier.enqueue(initial_state)
    explored = Set()
    
    while not frontier.is_empty():
        node = frontier.dequeue()
        explored.add(node.state)
        
        for action, next_state in get_valid_moves(node.state):
            if next_state not in explored and next_state not in frontier:
                if next_state == goal_state:
                    return reconstruct_path(child_node)
                frontier.enqueue(child_node)
    
    return "No Solution"`,
  },
  {
    id: 'DFS',
    title: 'Depth First Search (DFS)',
    category: 'Uninformed Search',
    description:
      'Explores as far as possible down each branch before backtracking using a LIFO Stack.',
    workingPrinciple:
      'Pushes successors to a stack, traversing deeply. Prone to getting trapped in deep cycles in graphs unless limited.',
    queueType: 'LIFO Stack',
    timeComplexity: 'O(b^m)',
    spaceComplexity: 'O(b · m) — Linear memory footprint',
    completeness: 'No in graphs with loops (unless visited set used)',
    optimality: 'No — Often produces non-optimal lengthy paths',
    advantages: ['Low memory usage proportional to search depth.'],
    limitations: ['Can find convoluted solutions with hundreds of moves.'],
    pseudocode: `function DEPTH-FIRST-SEARCH(problem):
    frontier = LIFO_Stack()
    frontier.push(problem.initial)
    ...`,
  },
  {
    id: 'DLS',
    title: 'Depth Limited Search (DLS)',
    category: 'Uninformed Search',
    description:
      'Depth First Search with a predetermined depth cutoff limit L.',
    workingPrinciple:
      'Stops exploring branches when current depth reaches depth limit L.',
    queueType: 'LIFO Stack with cutoff',
    timeComplexity: 'O(b^L)',
    spaceComplexity: 'O(b · L)',
    completeness: 'Conditional: Complete only if goal depth d ≤ L',
    optimality: 'No',
    advantages: ['Prevents infinite loop depth runaway.'],
    limitations: ['Fails if depth limit L is smaller than solution depth d.'],
    pseudocode: `function DLS(node, limit):
    if is_goal(node): return node
    if limit == 0: return cutoff
    ...`,
  },
  {
    id: 'IDDLS',
    title: 'Iterative Deepening DLS (IDDLS)',
    category: 'Uninformed Search',
    description:
      'Calls DLS with iteratively increasing depth limits 0, 1, 2, ...',
    workingPrinciple:
      'Combines DFS linear memory with BFS optimality by testing increasing depth caps.',
    queueType: 'Iterative Stack',
    timeComplexity: 'O(b^d)',
    spaceComplexity: 'O(b · d)',
    completeness: 'Yes',
    optimality: 'Yes',
    advantages: ['Optimal and complete like BFS, with low memory like DFS.'],
    limitations: ['Repeated expansion of upper tree levels.'],
    pseudocode: `for depth = 0 to infinity:
    result = DLS(initial, depth)
    if result != cutoff: return result`,
  },
  {
    id: 'GBFS',
    title: 'Greedy Best First Search (GBFS)',
    category: 'Informed (Heuristic) Search',
    description:
      'Expands the node that appears closest to the goal based on heuristic h(n).',
    workingPrinciple:
      'Uses Priority Queue ordered by h(n) (e.g. Manhattan Distance). Ignores path cost g(n).',
    queueType: 'Priority Queue ordered by h(n)',
    timeComplexity: 'O(b^m) worst case',
    spaceComplexity: 'O(b^m)',
    completeness: 'No (without cycle check)',
    optimality: 'No',
    advantages: ['Can find solutions very quickly.'],
    limitations: ['Not optimal: can be misled by heuristic.'],
    pseudocode: `frontier = PriorityQueue(key = h(n))
...`,
  },
  {
    id: 'ASTAR',
    title: 'A* Search',
    category: 'Informed (Heuristic) Search',
    description:
      'Evaluates nodes using f(n) = g(n) + h(n), combining actual cost so far with heuristic estimate.',
    workingPrinciple:
      'Guaranteed optimal when heuristic h(n) is admissible (never overestimates). Expands minimal nodes.',
    queueType: 'Priority Queue ordered by f(n) = g(n) + h(n)',
    timeComplexity: 'O(b^d)',
    spaceComplexity: 'O(b^d)',
    completeness: 'Yes',
    optimality: 'Yes (with admissible heuristic)',
    advantages: ['Optimally efficient search with guaranteed shortest path.'],
    limitations: ['High memory storage in priority queue.'],
    pseudocode: `frontier = PriorityQueue(key = g(n) + h(n))
...`,
  },
];

export const AlgorithmInfoPage = () => {
  const [selectedAlg, setSelectedAlg] = useState('BFS');
  const profile = ALGORITHMS_DATA.find((a) => a.id === selectedAlg) || ALGORITHMS_DATA[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-gradient-to-r from-[#fff1f3] via-white to-[#f7fee7] border border-[#fecdd3] rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-[#0f172a] font-bold text-base">
          <BookOpen className="w-5 h-5 text-[#ee2b47]" />
          <span>Algorithm Theory: Breadth First Search (BFS) & Comparisons</span>
        </div>
        <p className="text-xs text-[#64748b]">
          Theoretical foundation, working principles, time and space complexity analysis, and pseudocode.
        </p>

        {/* Algorithm Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {ALGORITHMS_DATA.map((alg) => (
            <button
              key={alg.id}
              onClick={() => setSelectedAlg(alg.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedAlg === alg.id
                  ? 'bg-[#ee2b47] text-white shadow-xs'
                  : 'bg-slate-100 text-[#1e232a] hover:bg-slate-200'
              }`}
            >
              <span>{alg.title.split(' ')[0]}</span>
              {alg.id === 'BFS' && (
                <span className="text-[10px] bg-[#ecfccb] text-[#365314] px-1.5 rounded font-mono font-bold">
                  Assigned
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Algorithm Profile */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-display text-[#1e232a]">
                {profile.title}
              </h2>
              {profile.id === 'BFS' && (
                <span className="text-xs font-bold text-[#ee2b47] bg-[#fff1f3] border border-[#fecdd3] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#ee2b47]" />
                  Assigned Technique
                </span>
              )}
            </div>
            <span className="text-xs text-[#64748b] font-medium">
              Queue: {profile.queueType} · {profile.category}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 bg-[#ecfccb] text-[#365314] rounded-lg font-bold">
              Optimal: {profile.optimality.startsWith('Yes') ? 'Yes' : 'No'}
            </span>
            <span className="px-2.5 py-1 bg-[#ecfccb] text-[#365314] rounded-lg font-bold">
              Complete: {profile.completeness.startsWith('Yes') ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {/* Working Principle */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#1e232a]">Working Principle</h3>
          <p className="text-xs text-[#334155] leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            {profile.workingPrinciple}
          </p>
        </div>

        {/* Complexities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[#64748b] font-medium text-[11px] block">Time Complexity</span>
            <span className="font-mono font-bold text-[#1e232a] text-sm">{profile.timeComplexity}</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[#64748b] font-medium text-[11px] block">Space Complexity</span>
            <span className="font-mono font-bold text-[#ee2b47] text-sm">{profile.spaceComplexity}</span>
          </div>
        </div>

        {/* Pros and Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#365314] flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#65a30d]" />
              <span>Advantages</span>
            </h4>
            <ul className="space-y-1.5 bg-[#f7fee7] p-3.5 rounded-xl border border-[#bef264] text-xs text-[#365314]">
              {profile.advantages.map((adv, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#65a30d] font-bold">·</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#9f1239] flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-[#ee2b47]" />
              <span>Limitations</span>
            </h4>
            <ul className="space-y-1.5 bg-[#fff1f3] p-3.5 rounded-xl border border-[#fecdd3] text-xs text-[#9f1239]">
              {profile.limitations.map((lim, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#ee2b47] font-bold">·</span>
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pseudocode in Light Clean Frame */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#0f172a]">Pseudocode</h4>
          <pre className="p-4 bg-slate-50 text-[#0f172a] rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-200">
            {profile.pseudocode}
          </pre>
        </div>
      </div>
    </div>
  );
};
