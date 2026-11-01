import { useState } from 'react'
import { ChevronDown, Crown, MapPin, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const sampleWeddings = [
  {
    id: 'sharma',
    name: 'The Sharma Wedding',
    location: 'Jaipur',
    dates: '18\u201320 December 2026',
  },
  {
    id: 'mehta',
    name: 'The Mehta Wedding',
    location: 'Udaipur',
    dates: '8\u201310 January 2027',
  },
]

const seasonMetrics = {
  activeWeddings: 25,
  seasonBudget: '\u20B948 Cr',
}

function Navbar() {
  const [activeWeddingId, setActiveWeddingId] = useState(sampleWeddings[0].id)
  const activeWedding = sampleWeddings.find(
    (wedding) => wedding.id === activeWeddingId,
  )

  return (
    <header className="border-b border-champagneGold/40 bg-royalMaroonDark text-creamIvory shadow-md">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <Link
          to="/enquiries"
          className="flex items-center gap-3 self-start rounded-md outline-none transition hover:text-champagneGold focus-visible:ring-2 focus-visible:ring-champagneGold lg:min-w-[280px]"
          aria-label="The Royal Knot home"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-champagneGold/70 bg-royalMaroon text-champagneGold">
            <Crown size={22} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-[0.17em] sm:text-base">
              THE ROYAL KNOT
            </span>
            <span className="mt-1 block text-[10px] tracking-[0.12em] text-champagneGoldLight sm:text-[11px]">
              {'DESTINATION WEDDINGS \u00B7 JAIPUR & UDAIPUR'}
            </span>
          </span>
        </Link>

        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <label
            htmlFor="active-wedding"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-champagneGoldLight"
          >
            Active wedding
          </label>
          <div className="relative">
            <select
              id="active-wedding"
              value={activeWeddingId}
              onChange={(event) => setActiveWeddingId(event.target.value)}
              className="w-full appearance-none rounded-md border border-champagneGold/50 bg-royalMaroon px-3 py-2.5 pr-10 text-sm text-creamIvory outline-none transition focus:border-champagneGold focus:ring-2 focus:ring-champagneGold/40"
            >
              {sampleWeddings.map((wedding) => (
                <option key={wedding.id} value={wedding.id}>
                  {wedding.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-champagneGold"
              size={17}
              aria-hidden="true"
            />
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-champagneGoldLight">
            <MapPin size={13} aria-hidden="true" />
            <span>{activeWedding.location}</span>
            <span aria-hidden="true">{'\u00B7'}</span>
            <span>{activeWedding.dates}</span>
          </p>
        </div>

        <div
          className="flex items-center gap-5 self-start lg:self-auto"
          aria-label="Season metrics"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-champagneGoldLight">
              Active Weddings
            </p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
              <UsersRound
                size={17}
                className="text-champagneGold"
                aria-hidden="true"
              />
              {seasonMetrics.activeWeddings}
            </p>
          </div>
          <div className="h-9 border-l border-champagneGold/40" aria-hidden="true" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-champagneGoldLight">
              Season Budget
            </p>
            <p className="mt-1 text-lg font-semibold text-champagneGoldLight">
              {seasonMetrics.seasonBudget}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
