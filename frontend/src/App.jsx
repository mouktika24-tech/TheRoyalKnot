import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AnimatedCard from './components/common/AnimatedCard.jsx'
import { ToastProvider } from './context/ToastProvider.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import Enquiries from './pages/Enquiries.jsx'
import Agreements from './pages/Agreements.jsx'

const VendorQuotes = lazy(() => import('./pages/VendorQuotes.jsx'))

const modules = [
  {
    path: 'planner',
    title: 'Instant Wedding Plan',
  },
  {
    path: 'schedule',
    title: 'Big Day Live Schedule',
  },
  {
    path: 'billing',
    title: 'Billing & Reconciliation',
  },
  {
    path: 'dashboard',
    title: "Founder's Season Review",
  },
]

function ModulePlaceholder({ title }) {
  return (
    <AnimatedCard className="mx-auto max-w-4xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-royalMaroon">
        The Royal Knot workspace
      </p>
      <h1 className="font-serif text-3xl font-semibold text-royalMaroonDark sm:text-4xl">
        {title}
      </h1>
      <div className="mt-6 rounded-xl border border-champagneGold/40 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-slateNavy">
          This module will be implemented in its assigned development phase.
        </p>
      </div>
    </AnimatedCard>
  )
}

function ModuleLoading() {
  return (
    <div
      className="mx-auto max-w-4xl rounded-xl border border-champagneGold/30 bg-white px-5 py-8 text-sm text-slateNavy/70 shadow-sm"
      role="status"
    >
      Loading vendor quotations…
    </div>
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
                <Suspense fallback={<ModuleLoading />}>
                  <VendorQuotes />
                </Suspense>
              }
            />
            {modules.map(({ path, title }) => (
              <Route
                key={path}
                path={path}
                element={<ModulePlaceholder title={title} />}
              />
            ))}
            <Route path="*" element={<Navigate to="/enquiries" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
