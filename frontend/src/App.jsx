import React, { useState } from 'react';
import TaskKanban from './components/planner/TaskKanban';
import LiveScheduleTimeline from './components/schedule/LiveScheduleTimeline';
import VendorCheckinBoard from './components/schedule/VendorCheckinBoard';
import ExpenseReconcilerModal from './components/billing/ExpenseReconcilerModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('reconcile');

  return (
      <div className="min-h-screen bg-white text-slate-900 font-sans">   
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-[#D4AF37]" aria-hidden="true" />
          <h1 className="text-sm font-bold tracking-wide text-slate-900">
            The Royal Knot <span className="text-xs font-normal text-[#D4AF37]">| Person 4 Test Shell</span>
          </h1>
        </div>

        <nav aria-label="Person 4 component views" className="flex gap-2">
          <button
            type="button"
            aria-pressed={activeTab === 'kanban'}
            onClick={() => setActiveTab('kanban')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] ${
              activeTab === 'kanban'
                ? 'border border-[#D4AF37]/50 bg-[#722F37] text-[#FFFDF9] shadow-lg shadow-[#722F37]/30'
                : 'bg-white text-slate-700 hover:text-slate-900'
            }`}
          >
            Scene 3: Task Kanban
          </button>

          <button
            type="button"
            aria-pressed={activeTab === 'timeline'}
            onClick={() => setActiveTab('timeline')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] ${
              activeTab === 'timeline'
                ? 'border border-[#D4AF37]/50 bg-[#722F37] text-[#FFFDF9] shadow-lg shadow-[#722F37]/30'
                : 'bg-white text-slate-700 hover:text-slate-900'
            }`}
          >
            Scene 4: Live Schedule
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'checkin'}
            onClick={() => setActiveTab('checkin')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] ${
              activeTab === 'checkin'
                ? 'border border-[#D4AF37]/50 bg-[#722F37] text-[#FFFDF9] shadow-lg shadow-[#722F37]/30'
                : 'bg-white text-slate-700 hover:text-slate-900'
            }`}
          >
            Scene 4: Vendor Check-In
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'reconcile'}
            onClick={() => setActiveTab('reconcile')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] ${
              activeTab === 'reconcile'
                ? 'border border-[#D4AF37]/50 bg-[#722F37] text-[#FFFDF9] shadow-lg shadow-[#722F37]/30'
                : 'bg-white text-slate-700 hover:text-slate-900'
            }`}
          >
            Scene 5: Reconciliation
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'kanban' && <TaskKanban />}
        {activeTab === 'timeline' && <LiveScheduleTimeline />}
        {activeTab === 'checkin' && <VendorCheckinBoard />}
        {activeTab === 'reconcile' && <ExpenseReconcilerModal />}
      </main>
    </div>
  );
}
