import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Clock3,
  FileStack,
  Search,
  Store,
} from 'lucide-react'
import AnimatedCard from '../components/common/AnimatedCard.jsx'
import AwardConfirmationModal from '../components/quotes/AwardConfirmationModal.jsx'
import QuoteComparisonMatrix from '../components/quotes/QuoteComparisonMatrix.jsx'
import QuoteDetailsModal from '../components/quotes/QuoteDetailsModal.jsx'
import { initialQuotes, weddingQuoteGroups } from '../data/mockQuotes.js'
import { useToast } from '../context/useToast.js'
import {
  calculateQuote,
  getQuoteRecommendations,
} from '../utils/quoteCalculations.js'

const statusFilters = ['ALL', 'PENDING', 'AWARDED', 'CLOSED']

const statisticDetails = [
  { key: 'total', label: 'Total quotations', icon: FileStack, accent: 'text-royalMaroon' },
  { key: 'pending', label: 'Pending review', icon: Clock3, accent: 'text-champagneGold' },
  { key: 'awarded', label: 'Awarded', icon: CheckCircle2, accent: 'text-emeraldSuccess' },
  { key: 'closed', label: 'Closed', icon: Store, accent: 'text-slateNavy' },
]

function VendorQuotes() {
  const [quotes, setQuotes] = useState(initialQuotes)
  const [selectedWeddingId, setSelectedWeddingId] = useState(
    weddingQuoteGroups[0].weddingId,
  )
  const [selectedCategory, setSelectedCategory] = useState('CATERER')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [detailsQuote, setDetailsQuote] = useState(null)
  const [awardQuote, setAwardQuote] = useState(null)
  const { showToast } = useToast()

  const selectedWedding =
    weddingQuoteGroups.find((wedding) => wedding.weddingId === selectedWeddingId) ??
    weddingQuoteGroups[0]

  const comparisonQuotes = useMemo(
    () =>
      quotes.filter(
        (quote) =>
          quote.weddingId === selectedWedding.weddingId &&
          quote.category === selectedCategory,
      ),
    [quotes, selectedCategory, selectedWedding.weddingId],
  )

  const categories = useMemo(
    () => [
      ...new Set(
        quotes
          .filter((quote) => quote.weddingId === selectedWedding.weddingId)
          .map((quote) => quote.category),
      ),
    ],
    [quotes, selectedWedding.weddingId],
  )

  const statistics = useMemo(
    () => ({
      total: comparisonQuotes.length,
      pending: comparisonQuotes.filter((quote) => quote.status === 'PENDING').length,
      awarded: comparisonQuotes.filter((quote) => quote.status === 'AWARDED').length,
      closed: comparisonQuotes.filter((quote) => quote.status === 'CLOSED').length,
    }),
    [comparisonQuotes],
  )

  const recommendation = useMemo(
    () => getQuoteRecommendations(comparisonQuotes),
    [comparisonQuotes],
  )

  const filteredQuotes = useMemo(() => {
    const query = search.trim().toLowerCase()

    return comparisonQuotes.filter((quote) => {
      const matchesStatus = activeFilter === 'ALL' || quote.status === activeFilter
      const matchesSearch =
        !query ||
        `${quote.vendorName} ${quote.quoteRef}`.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [activeFilter, comparisonQuotes, search])

  const isGroupAwarded = comparisonQuotes.some(
    (quote) => quote.status === 'AWARDED',
  )

  function handleWeddingChange(event) {
    const weddingId = event.target.value
    const nextCategory = quotes.find((quote) => quote.weddingId === weddingId)?.category

    setSelectedWeddingId(weddingId)
    if (nextCategory) setSelectedCategory(nextCategory)
    setActiveFilter('ALL')
    setSearch('')
    setAwardQuote(null)
    setDetailsQuote(null)
  }

  function handleConfirmAward() {
    if (!awardQuote) return

    const awardedQuote = awardQuote
    const finalTotal = calculateQuote(awardedQuote).finalTotal

    setQuotes((currentQuotes) =>
      currentQuotes.map((quote) => {
        if (
          quote.weddingId !== awardedQuote.weddingId ||
          quote.category !== awardedQuote.category ||
          quote.status !== 'PENDING'
        ) {
          return quote
        }

        return {
          ...quote,
          status: quote.id === awardedQuote.id ? 'AWARDED' : 'CLOSED',
        }
      }),
    )
    setAwardQuote(null)
    setActiveFilter('ALL')
    setSearch('')

    if (
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      confetti({
        particleCount: 34,
        spread: 48,
        startVelocity: 22,
        gravity: 0.95,
        scalar: 0.78,
        ticks: 120,
        origin: { x: 0.5, y: 0.68 },
        colors: ['#722F37', '#D4AF37', '#F3E5AB'],
        disableForReducedMotion: true,
      })
    }

    showToast({
      type: 'success',
      message: `${awardedQuote.vendorName} awarded at ${new Intl.NumberFormat(
        'en-IN',
        { style: 'currency', currency: 'INR', maximumFractionDigits: 0 },
      ).format(finalTotal)}. Competing quotations are closed.`,
    })
  }

  return (
    <>
      <div className="mx-auto max-w-[1500px] space-y-7">
        <AnimatedCard className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-royalMaroon">
              The Royal Knot · Vendor relations
            </p>
            <h1 className="font-serif text-3xl font-semibold text-royalMaroonDark sm:text-4xl">
              Vendor Quotations
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slateNavy/70 sm:text-base">
              Compare proposals, evaluate value and select the perfect partners
              for every celebration.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 md:max-w-xl">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slateNavy/60">
                Wedding
              </span>
              <select
                value={selectedWedding.weddingId}
                onChange={handleWeddingChange}
                className="min-h-11 w-full rounded-md border border-champagneGold/50 bg-white px-3 text-sm text-slateNavy outline-none focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15"
              >
                {weddingQuoteGroups.map((wedding) => (
                  <option key={wedding.weddingId} value={wedding.weddingId}>
                    {wedding.weddingName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slateNavy/60">
                Vendor category
              </span>
              <select
                value={selectedCategory}
                onChange={(event) => {
                  setSelectedCategory(event.target.value)
                  setActiveFilter('ALL')
                  setSearch('')
                }}
                className="min-h-11 w-full rounded-md border border-champagneGold/50 bg-white px-3 text-sm text-slateNavy outline-none focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'CATERER' ? 'Catering' : category}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.04}>
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-champagneGold/30 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:px-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-royalMaroon">
                Current comparison group
              </p>
              <p className="mt-1 font-serif text-lg font-semibold text-royalMaroonDark">
                {selectedWedding.weddingName}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-slateNavy/65">
                <span>{selectedWedding.city}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedWedding.venue}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedWedding.eventDates}</span>
              </p>
            </div>
            <div className="rounded-md bg-creamIvory px-3 py-2 text-xs">
              <p className="font-semibold text-royalMaroonDark">
                {selectedWedding.guestCount.toLocaleString('en-IN')} estimated guests
              </p>
              <p className="mt-0.5 text-slateNavy/60">
                Same wedding and category for every quote
              </p>
            </div>
          </div>
        </AnimatedCard>

        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Quotation statistics for selected comparison group"
        >
          {statisticDetails.map(({ key, label, icon: Icon, accent }, index) => (
            <AnimatedCard key={key} delay={index * 0.04}>
              <div className="flex items-center justify-between rounded-xl border border-champagneGold/25 bg-white px-4 py-4 shadow-sm sm:px-5">
                <div>
                  <p className="text-xs font-medium text-slateNavy/65">{label}</p>
                  <p className="mt-1 font-serif text-2xl font-semibold text-royalMaroonDark">
                    {statistics[key]}
                  </p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-creamIvory ${accent}`}>
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>
            </AnimatedCard>
          ))}
        </section>

        <AnimatedCard delay={0.12}>
          <section className="overflow-hidden rounded-xl border border-champagneGold/25 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-champagneGold/20 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-royalMaroonDark">
                    Catering comparison matrix
                  </h2>
                  <p className="mt-1 text-xs text-slateNavy/60">
                    {filteredQuotes.length} of {comparisonQuotes.length} quotations
                    in this comparison group
                  </p>
                </div>
                <label className="relative block w-full lg:max-w-sm">
                  <span className="sr-only">Search vendors or quote references</span>
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slateNavy/45"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search vendor or quote reference"
                    className="min-h-11 w-full rounded-md border border-slate-200 bg-creamIvory/70 pl-10 pr-3 text-sm outline-none transition placeholder:text-slateNavy/45 focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15"
                  />
                </label>
              </div>

              <div
                className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
                role="tablist"
                aria-label="Filter quotations by status"
              >
                {statusFilters.map((status) => {
                  const selected = activeFilter === status
                  const count =
                    status === 'ALL' ? statistics.total : statistics[status.toLowerCase()]

                  return (
                    <button
                      key={status}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveFilter(status)}
                      className={`min-h-9 shrink-0 rounded-full border px-4 text-[11px] font-semibold tracking-[0.06em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon ${
                        selected
                          ? 'border-royalMaroon bg-royalMaroon text-white'
                          : 'border-slate-200 bg-white text-slateNavy/70 hover:border-champagneGold hover:text-royalMaroon'
                      }`}
                    >
                      {status === 'ALL' ? 'All' : status}
                      <span className="ml-1.5 opacity-75">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="min-w-0 p-3 sm:p-4">
              <AnimatePresence mode="popLayout">
                <QuoteComparisonMatrix
                  key={`${selectedWedding.weddingId}-${selectedCategory}-${activeFilter}-${search}`}
                  quotes={filteredQuotes}
                  recommendation={recommendation}
                  isGroupAwarded={isGroupAwarded}
                  onViewDetails={setDetailsQuote}
                  onAward={setAwardQuote}
                />
              </AnimatePresence>
            </div>
          </section>
        </AnimatedCard>
      </div>

      {detailsQuote && (
        <QuoteDetailsModal
          quote={detailsQuote}
          wedding={selectedWedding}
          onClose={() => setDetailsQuote(null)}
        />
      )}
      {awardQuote && (
        <AwardConfirmationModal
          quote={awardQuote}
          wedding={selectedWedding}
          onClose={() => setAwardQuote(null)}
          onConfirm={handleConfirmAward}
        />
      )}
    </>
  )
}

export default VendorQuotes
