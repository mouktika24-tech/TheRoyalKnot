import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  GitCompare,
  Menu,
  Receipt,
  UsersRound,
  X,
} from 'lucide-react'

const navigationItems = [
  {
    label: 'Enquiries & Consultations',
    to: '/enquiries',
    icon: UsersRound,
  },
  {
    label: 'Digital Agreements',
    to: '/agreements',
    icon: FileCheck2,
  },
  {
    label: 'Vendor Quote Matrix',
    to: '/quotes',
    icon: GitCompare,
  },
  {
    label: 'Instant Wedding Plan',
    to: '/planner',
    icon: ClipboardList,
  },
  {
    label: 'Big Day Live Schedule',
    to: '/schedule',
    icon: CalendarDays,
  },
  {
    label: 'Billing & Reconciliation',
    to: '/billing',
    icon: Receipt,
  },
  {
    label: "Founder's Season Review",
    to: '/dashboard',
    icon: BarChart3,
  },
]

function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <nav
      className="w-full shrink-0 border-b border-champagneGold/30 bg-white lg:w-72 lg:border-b-0 lg:border-r"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between px-4 py-3 lg:hidden">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-royalMaroonDark">
          Wedding workspace
        </span>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-royalMaroon outline-none transition hover:bg-champagneGoldLight/50 focus-visible:ring-2 focus-visible:ring-royalMaroon"
          aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsMobileOpen((isOpen) => !isOpen)}
        >
          {isMobileOpen ? (
            <X size={21} aria-hidden="true" />
          ) : (
            <Menu size={21} aria-hidden="true" />
          )}
        </button>
      </div>

      <ul
        id="primary-navigation"
        className={`${isMobileOpen ? 'block' : 'hidden'} space-y-1 px-3 pb-4 lg:block lg:px-4 lg:py-6`}
      >
        {navigationItems.map(({ label, to, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-md border-l-4 px-3 py-2.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-royalMaroon ${
                  isActive
                    ? 'border-royalMaroon bg-champagneGoldLight/50 text-royalMaroonDark'
                    : 'border-transparent text-slateNavy hover:border-champagneGold hover:bg-creamIvory hover:text-royalMaroon'
                }`
              }
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Sidebar
