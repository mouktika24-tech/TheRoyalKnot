import { motion } from 'framer-motion'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePenLine,
  MapPin,
  ScrollText,
} from 'lucide-react'

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const statusStyles = {
  DRAFT: 'border-slate-300 bg-slate-100 text-slate-700',
  PENDING: 'border-champagneGold/70 bg-champagneGoldLight/50 text-royalMaroonDark',
  SIGNED: 'border-emeraldSuccess/30 bg-emeraldSuccess/10 text-emerald-800',
}

function formatDate(value) {
  return value
    ? dateFormatter.format(new Date(`${value}T00:00:00Z`))
    : 'Not recorded'
}

function StatusBadge({ status }) {
  const label = status === 'PENDING' ? 'PENDING SIGNATURE' : status

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] ${statusStyles[status]}`}
    >
      {status === 'SIGNED' ? (
        <CheckCircle2 size={12} aria-hidden="true" />
      ) : status === 'PENDING' ? (
        <Clock3 size={12} aria-hidden="true" />
      ) : (
        <FilePenLine size={12} aria-hidden="true" />
      )}
      {label}
    </span>
  )
}

function AgreementCard({ agreement, index, onView, onSign }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: index * 0.025 }}
      className="overflow-hidden rounded-xl border border-champagneGold/25 bg-white shadow-sm transition hover:border-champagneGold/60 hover:shadow-md"
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-champagneGold/40 bg-creamIvory text-royalMaroon">
              <ScrollText size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slateNavy/55">
                {agreement.agreementId}
              </p>
              <h2 className="mt-1 font-serif text-lg font-semibold text-royalMaroonDark">
                {agreement.coupleNames}
              </h2>
              <p className="mt-0.5 text-sm text-slateNavy/70">
                Prepared for {agreement.clientName}
              </p>
            </div>
          </div>
          <StatusBadge status={agreement.status} />
        </div>

        <div className="grid gap-3 border-y border-slate-100 py-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slateNavy/55">
              <MapPin size={13} className="text-royalMaroon" aria-hidden="true" />
              Wedding
            </p>
            <p className="mt-1 font-medium text-slateNavy">
              {agreement.city} · {agreement.venue}
            </p>
            <p className="mt-1 text-xs text-slateNavy/65">
              {formatDate(agreement.startDate)} – {formatDate(agreement.endDate)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slateNavy/55">
              <CalendarDays size={13} className="text-royalMaroon" aria-hidden="true" />
              Created
            </p>
            <p className="mt-1 font-medium text-slateNavy">
              {formatDate(agreement.createdAt)}
            </p>
            {agreement.signatureDate && (
              <p className="mt-1 text-xs text-emerald-800">
                Signed {formatDate(agreement.signatureDate)}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slateNavy/55">
              Service package
            </p>
            <p className="mt-1 font-medium text-slateNavy">{agreement.packageType}</p>
            <p className="mt-1 text-xs text-slateNavy/65">
              {agreement.guestCount} expected guests
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slateNavy/55">
              Total contract value
            </p>
            <p className="mt-1 font-serif text-lg font-semibold text-royalMaroonDark">
              {moneyFormatter.format(agreement.contractValue)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onView(agreement)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-royalMaroon/30 px-4 text-xs font-semibold text-royalMaroon transition hover:bg-creamIvory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
          >
            <ScrollText size={15} aria-hidden="true" />
            View agreement
          </button>
          {agreement.status === 'PENDING' && (
            <button
              type="button"
              onClick={() => onSign(agreement)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-royalMaroon px-4 text-xs font-semibold text-white transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon focus-visible:ring-offset-2"
            >
              <FilePenLine size={15} aria-hidden="true" />
              Sign agreement
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}

function AgreementList({ agreements, onView, onSign }) {
  if (agreements.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-champagneGold/60 bg-white px-5 py-12 text-center">
        <p className="font-serif text-xl font-semibold text-royalMaroonDark">
          No agreements found
        </p>
        <p className="mt-2 text-sm text-slateNavy/65">
          Try another search or status filter.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {agreements.map((agreement, index) => (
        <AgreementCard
          key={agreement.id}
          agreement={agreement}
          index={index}
          onView={onView}
          onSign={onSign}
        />
      ))}
    </div>
  )
}

export default AgreementList
