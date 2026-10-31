import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Plus,
  Search,
  Wallet,
} from 'lucide-react'
import AnimatedCard from '../components/common/AnimatedCard.jsx'
import MilestonePaymentCards from '../components/payments/MilestonePaymentCards.jsx'
import PaymentHistory from '../components/payments/PaymentHistory.jsx'
import RecordPaymentModal from '../components/payments/RecordPaymentModal.jsx'
import { useToast } from '../context/useToast.js'
import { initialPayments, initialPaymentWeddings } from '../data/mockPayments.js'
import { formatCurrency } from '../utils/currency.js'
import {
  calculatePaymentSummary,
  getTodayDate,
} from '../utils/paymentCalculations.js'

const milestoneFilters = ['ALL', 'PENDING', 'PARTIAL', 'OVERDUE', 'PAID']

const statistics = [
  { key: 'totalContractValue', label: 'Total contract value', icon: CircleDollarSign, accent: 'text-royalMaroon' },
  { key: 'totalReceived', label: 'Amount received', icon: CheckCircle2, accent: 'text-emerald-700' },
  { key: 'outstandingBalance', label: 'Outstanding balance', icon: Wallet, accent: 'text-slateNavy' },
  { key: 'overdueAmount', label: 'Overdue amount', icon: AlertCircle, accent: 'text-rubyDanger' },
]

function Payments() {
  const [weddings] = useState(initialPaymentWeddings)
  const [payments, setPayments] = useState(initialPayments)
  const [selectedWeddingId, setSelectedWeddingId] = useState('all')
  const [weddingSearch, setWeddingSearch] = useState('')
  const [milestoneFilter, setMilestoneFilter] = useState('ALL')
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [recordDefaults, setRecordDefaults] = useState({ weddingId: '', milestoneId: 'booking' })
  const { showToast } = useToast()

  const matchingWeddings = useMemo(() => {
    const query = weddingSearch.trim().toLowerCase()
    const weddingScope = selectedWeddingId === 'all'
      ? weddings
      : weddings.filter((wedding) => wedding.id === selectedWeddingId)

    return weddingScope.filter((wedding) =>
      !query ||
      `${wedding.weddingName} ${wedding.clientName} ${wedding.coupleNames} ${wedding.city}`
        .toLowerCase()
        .includes(query),
    )
  }, [selectedWeddingId, weddingSearch, weddings])

  const summary = useMemo(
    () => calculatePaymentSummary(matchingWeddings, payments),
    [matchingWeddings, payments],
  )

  const scopedPayments = useMemo(() => {
    const weddingIds = new Set(matchingWeddings.map((wedding) => wedding.id))
    return payments.filter((payment) => weddingIds.has(payment.weddingId))
  }, [matchingWeddings, payments])

  const milestoneGroups = useMemo(
    () =>
      matchingWeddings.map((wedding) => ({
        wedding,
        milestones: summary.milestones
          .filter((milestone) => milestone.weddingId === wedding.id)
          .filter(
            (milestone) =>
              milestoneFilter === 'ALL' || milestone.status === milestoneFilter,
          ),
      })),
    [matchingWeddings, milestoneFilter, summary.milestones],
  )

  function openRecordModal(milestone, weddingId) {
    setRecordDefaults({
      weddingId: weddingId ?? milestone?.weddingId ?? matchingWeddings[0]?.id ?? weddings[0]?.id ?? '',
      milestoneId: milestone?.id ?? 'booking',
    })
    setIsRecordModalOpen(true)
  }

  function handleRecordPayment(details) {
    const paymentId = `RK-PAY-${Date.now()}`
    const newPayment = {
      ...details,
      paymentId,
      status: 'RECORDED',
    }

    setPayments((currentPayments) => [...currentPayments, newPayment])
    setIsRecordModalOpen(false)
    showToast({
      type: 'success',
      message: `${formatCurrency(details.amount)} payment recorded for ${
        weddings.find((wedding) => wedding.id === details.weddingId)?.weddingName
      }.`,
    })
  }

  const primaryWedding = matchingWeddings[0]
  const progress = Math.round(summary.paymentProgress)
  const today = getTodayDate()

  return (
    <>
      <div className="mx-auto max-w-[1500px] space-y-7">
        <AnimatedCard className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-royalMaroon">
              The Royal Knot · Client finance
            </p>
            <h1 className="font-serif text-3xl font-semibold text-royalMaroonDark sm:text-4xl">
              Client Payments
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slateNavy/70 sm:text-base">
              Track every milestone, manage collections and keep every wedding
              financially on schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openRecordModal(null, primaryWedding?.id)}
            disabled={weddings.length === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-royalMaroon px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} aria-hidden="true" />
            Record a payment
          </button>
        </AnimatedCard>

        <AnimatedCard delay={0.04}>
          <div className="grid gap-3 rounded-xl border border-champagneGold/30 bg-white p-4 shadow-sm sm:grid-cols-[minmax(220px,0.8fr)_minmax(260px,1.2fr)] sm:p-5">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slateNavy/60">
                Wedding scope
              </span>
              <select
                value={selectedWeddingId}
                onChange={(event) => setSelectedWeddingId(event.target.value)}
                className="min-h-11 w-full rounded-md border border-champagneGold/50 bg-white px-3 text-sm text-slateNavy outline-none focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15"
                aria-label="Select wedding scope"
              >
                <option value="all">All weddings</option>
                {weddings.map((wedding) => (
                  <option key={wedding.id} value={wedding.id}>
                    {wedding.weddingName} · {wedding.city}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slateNavy/60">
                Search weddings or clients
              </span>
              <span className="relative block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slateNavy/45"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={weddingSearch}
                  onChange={(event) => setWeddingSearch(event.target.value)}
                  placeholder="Search by wedding or client name"
                  className="min-h-11 w-full rounded-md border border-champagneGold/50 bg-white pl-9 pr-3 text-sm text-slateNavy outline-none focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15"
                  aria-label="Search by wedding or client name"
                />
              </span>
            </label>
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.08}>
          <section aria-label="Payment dashboard summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statistics.map(({ key, label, icon: Icon, accent }) => (
              <article
                key={key}
                className="rounded-xl border border-champagneGold/30 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slateNavy/60">
                    {label}
                  </p>
                  <Icon size={18} className={accent} aria-hidden="true" />
                </div>
                <p className="mt-3 break-words font-serif text-xl font-bold text-royalMaroonDark sm:text-2xl">
                  {formatCurrency(summary[key])}
                </p>
              </article>
            ))}
          </section>
        </AnimatedCard>

        <AnimatedCard delay={0.12}>
          <section
            aria-label="Overall payment progress"
            className="grid gap-5 rounded-xl border border-champagneGold/35 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[1.4fr_1fr]"
          >
            <div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-royalMaroon">
                    Portfolio collections
                  </p>
                  <h2 className="mt-1 font-serif text-lg font-semibold text-royalMaroonDark">
                    Overall payment progress
                  </h2>
                </div>
                <p className="font-serif text-2xl font-bold text-royalMaroon">{progress}%</p>
              </div>
              <div
                className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Overall payment progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div
                  className="h-full rounded-full bg-royalMaroon transition-all"
                  style={{ width: `${summary.paymentProgress}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-slateNavy/60">
                <span>Received {formatCurrency(summary.totalReceived)}</span>
                <span>Contracted {formatCurrency(summary.totalContractValue)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-champagneGold/30 bg-creamIvory/70 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-champagneGoldLight/45 text-royalMaroon">
                {summary.upcomingPayment ? (
                  <CalendarClock size={19} aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={19} aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slateNavy/60">
                  Upcoming payment
                </p>
                {summary.upcomingPayment ? (
                  <>
                    <p className="mt-1 truncate text-sm font-semibold text-royalMaroonDark">
                      {summary.upcomingPayment.weddingName} · {summary.upcomingPayment.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slateNavy/65">
                      {formatCurrency(summary.upcomingPayment.remaining)} · Due{' '}
                      {new Intl.DateTimeFormat('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC',
                      }).format(new Date(`${summary.upcomingPayment.dueDate}T00:00:00Z`))}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-emerald-800">
                    No upcoming milestones in this scope
                  </p>
                )}
              </div>
              {summary.upcomingPayment && (
                <ArrowUpRight size={16} className="ml-auto shrink-0 text-royalMaroon" aria-hidden="true" />
              )}
            </div>
          </section>
        </AnimatedCard>

        <AnimatedCard delay={0.16}>
          <section aria-labelledby="milestones-heading" className="space-y-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-royalMaroon">
                  20% booking · 50% planning · 30% final
                </p>
                <h2 id="milestones-heading" className="mt-1 font-serif text-2xl font-semibold text-royalMaroonDark">
                  Payment milestones
                </h2>
              </div>
              <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-champagneGold/30 bg-white p-1">
                {milestoneFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setMilestoneFilter(filter)}
                    aria-pressed={milestoneFilter === filter}
                    className={`min-h-9 shrink-0 rounded-md px-3 text-[10px] font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon ${
                      milestoneFilter === filter
                        ? 'bg-royalMaroon text-white'
                        : 'text-slateNavy/65 hover:bg-creamIvory hover:text-royalMaroon'
                    }`}
                  >
                    {filter === 'ALL' ? 'All statuses' : filter}
                  </button>
                ))}
              </div>
            </div>

            {milestoneGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-champagneGold/55 bg-white px-5 py-10 text-center">
                <p className="font-serif text-lg font-semibold text-royalMaroonDark">No weddings match this search</p>
                <p className="mt-1 text-sm text-slateNavy/65">Adjust your search or wedding selection.</p>
              </div>
            ) : milestoneGroups.every((group) => group.milestones.length === 0) ? (
              <div className="rounded-xl border border-dashed border-champagneGold/55 bg-white px-5 py-10 text-center">
                <p className="font-serif text-lg font-semibold text-royalMaroonDark">No milestones in this status</p>
                <p className="mt-1 text-sm text-slateNavy/65">Choose another status to see payment milestones.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {milestoneGroups
                  .filter((group) => group.milestones.length > 0)
                  .map((group) => (
                    <MilestonePaymentCards
                      key={group.wedding.id}
                      wedding={group.wedding}
                      milestones={group.milestones}
                      onRecordPayment={(milestone) => openRecordModal(milestone, group.wedding.id)}
                    />
                  ))}
              </div>
            )}
          </section>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <PaymentHistory payments={scopedPayments} weddings={weddings} />
        </AnimatedCard>

        <p className="text-center text-[10px] text-slateNavy/45">
          Demonstration data only · Payments are held in temporary page state and are not persisted.
          {today ? ` As of ${today}.` : ''}
        </p>
      </div>

      {isRecordModalOpen && (
        <RecordPaymentModal
          weddings={weddings}
          payments={payments}
          defaultWeddingId={recordDefaults.weddingId}
          defaultMilestoneId={recordDefaults.milestoneId}
          onClose={() => setIsRecordModalOpen(false)}
          onSubmit={handleRecordPayment}
        />
      )}
    </>
  )
}

export default Payments
