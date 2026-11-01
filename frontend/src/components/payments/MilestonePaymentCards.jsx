import { motion } from 'framer-motion'
import { CalendarDays, CheckCircle2, Clock3, IndianRupee } from 'lucide-react'
import { formatCurrency } from '../../utils/currency.js'

const statusStyles = {
  PAID: 'border-emeraldSuccess/40 bg-emeraldSuccess/10 text-emerald-800',
  PARTIAL: 'border-champagneGold/60 bg-champagneGoldLight/35 text-royalMaroonDark',
  PENDING: 'border-slate-300 bg-slate-100 text-slate-600',
  OVERDUE: 'border-rubyDanger/35 bg-rubyDanger/10 text-rubyDanger',
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(value) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`))
}

function MilestonePaymentCards({ wedding, milestones, onRecordPayment }) {
  return (
    <section aria-label={`Payment milestones for ${wedding.weddingName}`}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-serif text-xl font-semibold text-royalMaroonDark">
            {wedding.weddingName}
          </h3>
          <p className="mt-1 text-xs text-slateNavy/60">
            {wedding.clientName} · {wedding.city} · {wedding.venue}
          </p>
        </div>
        <p className="text-xs font-medium text-slateNavy/65">
          Contract {formatCurrency(wedding.contractValue)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {milestones.map((milestone, index) => {
          const progress = Math.round(milestone.progress)
          const isPaid = milestone.status === 'PAID'

          return (
            <motion.article
              key={milestone.id}
              className="min-w-0 rounded-xl border border-champagneGold/30 bg-white p-4 shadow-sm sm:p-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.035 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-royalMaroon">
                    Milestone {milestone.sequence} · {milestone.percentage}%
                  </p>
                  <h4 className="mt-1 font-serif text-lg font-semibold text-royalMaroonDark">
                    {milestone.name}
                  </h4>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.08em] ${statusStyles[milestone.status]}`}
                >
                  {milestone.status === 'PAID' ? (
                    <CheckCircle2 size={12} aria-hidden="true" />
                  ) : milestone.status === 'OVERDUE' ? (
                    <Clock3 size={12} aria-hidden="true" />
                  ) : null}
                  {milestone.status}
                </span>
              </div>

              <dl className="mt-4 space-y-2.5 text-xs">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-slateNavy/60">Total due</dt>
                  <dd className="text-sm font-semibold text-royalMaroonDark">
                    {formatCurrency(milestone.amount)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slateNavy/60">Amount received</dt>
                  <dd className="font-medium text-slateNavy">
                    {formatCurrency(milestone.amountPaid)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slateNavy/60">Remaining</dt>
                  <dd className={milestone.remaining > 0 ? 'font-semibold text-royalMaroon' : 'font-semibold text-emerald-700'}>
                    {formatCurrency(milestone.remaining)}
                  </dd>
                </div>
              </dl>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-[10px] text-slateNavy/60">
                  <span>Milestone progress</span>
                  <span>{progress}%</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={`${milestone.name} payment progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className={`h-full rounded-full transition-all ${isPaid ? 'bg-emeraldSuccess' : milestone.status === 'OVERDUE' ? 'bg-rubyDanger' : 'bg-champagneGold'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <p className="flex items-center gap-1.5 text-[11px] text-slateNavy/65">
                  <CalendarDays size={13} className="text-royalMaroon" aria-hidden="true" />
                  Due {formatDate(milestone.dueDate)}
                </p>
                <button
                  type="button"
                  onClick={() => onRecordPayment(milestone)}
                  disabled={isPaid}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-royalMaroon px-3 text-xs font-semibold text-white transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <IndianRupee size={13} aria-hidden="true" />
                  {isPaid ? 'Paid in full' : 'Record payment'}
                </button>
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

export default MilestonePaymentCards
