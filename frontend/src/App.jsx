import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Users, 
  FileText, 
  Layers, 
  CheckSquare, 
  Clock, 
  CreditCard, 
  TrendingUp, 
  ChevronDown,
  UserCheck
} from 'lucide-react';

import TaskKanban from './components/planner/TaskKanban';
import LiveScheduleTimeline from './components/schedule/LiveScheduleTimeline';
import VendorCheckinBoard from './components/schedule/VendorCheckinBoard';
import ExpenseReconcilerModal from './components/billing/ExpenseReconcilerModal';
import FounderSeasonDashboard from './components/dashboard/FounderSeasonDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('kanban');
  const [scheduleSubView, setScheduleSubView] = useState('timeline'); // 'timeline' | 'checkin'

  const navItems = [
    { id: 'enquiries', label: 'Enquiries & Consultations', icon: Users, disabled: true },
    { id: 'agreements', label: 'Digital Agreements', icon: FileText, disabled: true },
    { id: 'quotes', label: 'Vendor Quote Matrix', icon: Layers, disabled: true },
    { id: 'kanban', label: 'Instant Wedding Plan', icon: CheckSquare, disabled: false },
    { id: 'schedule', label: 'Big Day Live Schedule', icon: Clock, disabled: false },
    { id: 'billing', label: 'Billing & Reconciliation', icon: CreditCard, disabled: false },
    { id: 'founder', label: "Founder's Season Review", icon: TrendingUp, disabled: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] font-sans text-[#2A211D]">
      {/* 1. Person 3 Luxury Burgundy Top Bar */}
      <header className="h-16 bg-[#722F37] text-white px-6 flex items-center justify-between border-b border-[#5B1F27] shadow-md sticky top-0 z-50">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-[#D4AF37] flex items-center justify-center bg-[#5B1F27] text-[#D4AF37] shadow-inner text-base">
            👑
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-[0.22em] font-serif font-bold text-white block">
              THE ROYAL KNOT
            </span>
            <span className="text-[9px] uppercase tracking-[0.16em] text-[#D4AF37] font-medium block">
              DESTINATION WEDDINGS · JAIPUR & UDAIPUR
            </span>
          </div>
        </div>

        {/* Center: Active Wedding Selector */}
        <div className="hidden md:flex flex-col items-center">
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-0.5">
            ACTIVE WEDDING
          </span>
          <div className="flex items-center gap-2 bg-[#5B1F27]/80 hover:bg-[#5B1F27] px-3.5 py-1 rounded border border-[#8B3A44] transition-all cursor-pointer">
            <span className="text-xs font-serif font-semibold text-white tracking-wide">
              The Sharma Wedding
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <span className="text-[10px] text-white/70 tracking-wide mt-0.5 font-light">
            Jaipur · 18–20 December 2026
          </span>
        </div>

        {/* Right: Executive Quick Stats */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-[0.16em] text-white/70 block font-medium">
              ACTIVE WEDDINGS
            </span>
            <div className="flex items-center justify-end gap-1 text-xs font-bold text-white">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>25</span>
            </div>
          </div>

          <div className="text-right border-l border-white/20 pl-6">
            <span className="text-[9px] uppercase tracking-[0.16em] text-white/70 block font-medium">
              SEASON BUDGET
            </span>
            <span className="text-sm font-bold text-[#D4AF37] font-mono tracking-tight">
              ₹48 Cr
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Body: Sidebar + Main Workspace */}
      <div className="flex flex-1 min-h-[calc(100vh-64px)]">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 bg-white border-r border-[#ECE7E1] py-4 flex flex-col justify-between shrink-0">
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-xs transition-all relative text-left ${
                    item.disabled
                      ? 'opacity-40 cursor-not-allowed text-[#8C827A]'
                      : isActive
                        ? 'bg-[#FCF6EC] text-[#2A211D] font-bold border-l-4 border-[#722F37]'
                        : 'text-[#6B635B] hover:bg-[#F7F4F0] hover:text-[#2A211D] font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#722F37]' : 'text-[#8C827A]'}`} />
                  <span className="tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="px-5 py-3 border-t border-[#ECE7E1] text-[11px] text-[#8C827A]">
            <p className="font-serif italic">The Royal Knot v2.4</p>
            <p className="text-[10px] text-[#A69B91]">Unified Operations Workspace</p>
          </div>
        </aside>

        {/* Workspace Content View */}
        <main className="flex-1 bg-[#FFFDF9] overflow-y-auto">
          {/* Sub-navigation for Big Day Schedule (Timeline vs Check-in) */}
          {activeTab === 'schedule' && (
            <div className="bg-white border-b border-[#ECE7E1] px-8 py-2.5 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#8C827A]">
                Schedule Views
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScheduleSubView('timeline')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all border ${
                    scheduleSubView === 'timeline'
                      ? 'bg-[#722F37] text-white border-[#722F37] shadow-sm'
                      : 'bg-white text-[#6B635B] border-[#ECE7E1] hover:bg-[#F7F4F0]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Minute-by-Minute Timeline
                </button>
                <button
                  onClick={() => setScheduleSubView('checkin')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all border ${
                    scheduleSubView === 'checkin'
                      ? 'bg-[#722F37] text-white border-[#722F37] shadow-sm'
                      : 'bg-white text-[#6B635B] border-[#ECE7E1] hover:bg-[#F7F4F0]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                  Vendor Arrival Check-In
                </button>
              </div>
            </div>
          )}

          <div className="p-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${activeTab}${activeTab === 'schedule' ? scheduleSubView : ''}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {activeTab === 'kanban' && <TaskKanban />}
                {activeTab === 'schedule' && (
                  scheduleSubView === 'timeline' ? <LiveScheduleTimeline /> : <VendorCheckinBoard />
                )}
                {activeTab === 'billing' && <ExpenseReconcilerModal />}
                {activeTab === 'founder' && <FounderSeasonDashboard />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}