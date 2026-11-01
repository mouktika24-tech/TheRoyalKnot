import { lazy, Suspense, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ExpenseReconcilerModal from './components/billing/ExpenseReconcilerModal.jsx'
import FounderSeasonDashboard from './components/dashboard/FounderSeasonDashboard.jsx'
import TaskKanban from './components/planner/TaskKanban.jsx'
import LiveScheduleTimeline from './components/schedule/LiveScheduleTimeline.jsx'
import VendorCheckinBoard from './components/schedule/VendorCheckinBoard.jsx'
import { ToastProvider } from './context/ToastProvider.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import Enquiries from './pages/Enquiries.jsx'
import Agreements from './pages/Agreements.jsx'

const VendorQuotes = lazy(() => import('./pages/VendorQuotes.jsx'))
const Payments = lazy(() => import('./pages/Payments.jsx'))

function ModuleLoading({ label }) {
  return (
    <div
      className="mx-auto max-w-4xl rounded-xl border border-champagneGold/30 bg-white px-5 py-8 text-sm text-slateNavy/70 shadow-sm"
      role="status"
    >
      Loading {label}…
    </div>
  )
}

function ScheduleWorkspace() {
  const [scheduleView, setScheduleView] = useState('timeline')

  return (
    <section className="space-y-5">
      <div className="glass-panel motion-lift flex flex-wrap items-center justify-between gap-3 rounded-xl p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slateNavy/70">
          Schedule views
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={scheduleView === 'timeline'}
            onClick={() => setScheduleView('timeline')}
            className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
              scheduleView === 'timeline'
                ? 'border-royalMaroon bg-royalMaroon text-white'
                : 'border-champagneGold/40 bg-white text-slateNavy hover:bg-creamIvory'
            }`}
          >
            Minute-by-Minute Timeline
          </button>
          <button
            type="button"
            aria-pressed={scheduleView === 'checkin'}
            onClick={() => setScheduleView('checkin')}
            className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
              scheduleView === 'checkin'
                ? 'border-royalMaroon bg-royalMaroon text-white'
                : 'border-champagneGold/40 bg-white text-slateNavy hover:bg-creamIvory'
            }`}
          >
            Vendor Arrival Check-In
          </button>
        </div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={scheduleView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {scheduleView === 'timeline'
            ? <LiveScheduleTimeline />
            : <VendorCheckinBoard />}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

function BillingWorkspace() {
  const [billingView, setBillingView] = useState('reconciliation')

  return (
    <section className="space-y-5">
      <div className="glass-panel flex flex-wrap items-center gap-2 rounded-xl p-3">
        <button
          type="button"
          aria-pressed={billingView === 'reconciliation'}
          onClick={() => setBillingView('reconciliation')}
          className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
            billingView === 'reconciliation'
              ? 'border-royalMaroon bg-royalMaroon text-white'
              : 'border-champagneGold/40 bg-white text-slateNavy hover:bg-creamIvory'
          }`}
        >
          Expense reconciliation
        </button>
        <button
          type="button"
          aria-pressed={billingView === 'payments'}
          onClick={() => setBillingView('payments')}
          className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
            billingView === 'payments'
              ? 'border-royalMaroon bg-royalMaroon text-white'
              : 'border-champagneGold/40 bg-white text-slateNavy hover:bg-creamIvory'
          }`}
        >
          Milestone payments
        </button>
      </div>
      {billingView === 'reconciliation' ? (
        <ExpenseReconcilerModal />
      ) : (
        <Suspense fallback={<ModuleLoading label="client payments" />}>
          <Payments />
        </Suspense>
      )}
    </section>
  )
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/enquiries" replace />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="agreements" element={<Agreements />} />
            <Route
              path="quotes"
              element={
                <Suspense fallback={<ModuleLoading label="vendor quotations" />}>
                  <VendorQuotes />
                </Suspense>
              }
            />
            <Route path="planner" element={<TaskKanban />} />
            <Route path="schedule" element={<ScheduleWorkspace />} />
            <Route path="vendor-checkin" element={<VendorCheckinBoard />} />
            <Route path="billing" element={<BillingWorkspace />} />
            <Route path="dashboard" element={<FounderSeasonDashboard />} />
            <Route path="*" element={<Navigate to="/enquiries" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
