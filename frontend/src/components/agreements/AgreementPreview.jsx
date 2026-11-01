import { motion } from 'framer-motion'
import {
  Building2,
  CalendarDays,
  MapPin,
  Printer,
  X,
} from 'lucide-react'

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const services = [
  'Wedding planning and coordination',
  'Vendor sourcing and management',
  'Venue coordination',
  'Event-day execution',
  'Guest experience coordination',
  'Schedule and logistics management',
]

const terms = [
  {
    title: 'Scope of engagement',
    text: 'The agency will coordinate the selected wedding planning and management services described in this demonstration agreement and the agreed event brief.',
  },
  {
    title: 'Client responsibilities',
    text: 'The client will provide timely decisions, accurate event information, guest requirements, and approvals needed to coordinate the celebration.',
  },
  {
    title: 'Vendor coordination',
    text: 'The agency may assist with sourcing and coordinating independent vendors. Vendor availability, deliverables, and charges should be confirmed directly in approved written schedules.',
  },
  {
    title: 'Payment obligations',
    text: 'The illustrative milestones below are planning estimates. A final payment schedule and payment instructions must be reviewed and agreed by the parties before use.',
  },
  {
    title: 'Changes and additional services',
    text: 'Changes to the event brief, guest count, schedule, or requested services may affect fees and availability. Any adjustment should be documented and approved by both parties.',
  },
  {
    title: 'Cancellation and rescheduling',
    text: 'If plans change, the parties should promptly discuss available options and document any revised scope, dates, vendor commitments, and costs.',
  },
  {
    title: 'Force majeure',
    text: 'If circumstances beyond a party’s reasonable control materially affect the event, the parties should communicate promptly and work together on practical next steps.',
  },
  {
    title: 'Final settlement',
    text: 'A final account should summarize approved services, vendor commitments, payments, and any documented changes for review by both parties.',
  },
]

function formatDate(value) {
  return value
    ? dateFormatter.format(new Date(`${value}T00:00:00Z`))
    : 'To be confirmed'
}

function AgreementPreview({ agreement, onClose }) {
  const milestones = [
    { label: 'Booking advance · 20%', amount: agreement.contractValue * 0.2 },
    { label: 'Planning milestone · 50%', amount: agreement.contractValue * 0.5 },
    { label: 'Final milestone · 30%', amount: agreement.contractValue * 0.3 },
  ]

  return (
    <motion.div
      className="agreement-preview-overlay fixed inset-0 z-40 overflow-y-auto bg-slateNavy/65 p-0 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Agreement preview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="mx-auto flex min-h-full max-w-[920px] flex-col sm:justify-center">
        <div className="agreement-print-actions sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-champagneGold/30 bg-creamIvory px-4 py-3 sm:rounded-t-xl sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-royalMaroon">
              Agreement preview
            </p>
            <p className="truncate text-xs text-slateNavy/65">{agreement.agreementId}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-royalMaroon px-3 text-xs font-semibold text-white transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
            >
              <Printer size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Print / Save as PDF</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-slateNavy/70 transition hover:bg-champagneGoldLight/50 hover:text-royalMaroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
              aria-label="Close agreement preview"
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>
        </div>

        <article className="agreement-print-document mx-auto w-full max-w-[820px] bg-white px-6 py-8 shadow-2xl sm:px-12 sm:py-12">
          <header className="border-b-2 border-champagneGold pb-5 text-center">
            <p className="font-serif text-2xl font-bold tracking-[0.2em] text-royalMaroonDark">
              THE ROYAL KNOT
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-royalMaroon">
              Luxury Wedding Planning &amp; Management
            </p>
            <p className="mt-1 text-xs text-slateNavy/70">
              Jaipur <span className="px-1 text-champagneGold">|</span> Udaipur{' '}
              <span className="px-1 text-champagneGold">|</span> Jodhpur
            </p>
            <div className="mt-4 flex flex-wrap justify-between gap-2 text-left text-[10px] uppercase tracking-[0.08em] text-slateNavy/65">
              <span>Agreement ID: {agreement.agreementId}</span>
              <span>Document date: {formatDate(agreement.createdAt)}</span>
            </div>
          </header>

          <div className="my-6 border border-champagneGold/60 bg-champagneGoldLight/20 px-4 py-3 text-xs leading-5 text-royalMaroonDark">
            <strong>Prototype document for review.</strong> The clauses and terms
            in this interface are illustrative, have not been legally reviewed,
            and should be reviewed by the agency’s legal team before any real-world use.
          </div>

          <h1 className="mb-7 text-center font-serif text-xl font-bold leading-snug tracking-[0.08em] text-royalMaroonDark sm:text-2xl">
            WEDDING PLANNING &amp; MANAGEMENT
            <br />
            SERVICE AGREEMENT
          </h1>

          <section className="agreement-section mb-6">
            <h2 className="mb-3 border-b border-champagneGold/60 pb-2 font-serif text-base font-bold text-royalMaroon">
              01. Parties
            </h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="border-l-2 border-champagneGold pl-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slateNavy/55">
                  Planning agency
                </p>
                <p className="mt-1 font-semibold text-royalMaroonDark">
                  The Royal Knot
                </p>
                <p className="mt-1 leading-5 text-slateNavy/75">
                  Luxury Wedding Planning &amp; Management
                  <br />
                  Jaipur, Rajasthan, India
                </p>
              </div>
              <div className="border-l-2 border-champagneGold pl-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slateNavy/55">
                  Client
                </p>
                <p className="mt-1 font-semibold text-royalMaroonDark">
                  {agreement.clientName}
                </p>
                <p className="mt-1 leading-5 text-slateNavy/75">
                  {agreement.coupleNames}
                  <br />
                  {agreement.clientEmail}
                  <br />
                  {agreement.clientPhone}
                </p>
              </div>
            </div>
          </section>

          <section className="agreement-section mb-6">
            <h2 className="mb-3 border-b border-champagneGold/60 pb-2 font-serif text-base font-bold text-royalMaroon">
              02. Event details
            </h2>
            <div className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <p className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-royalMaroon" aria-hidden="true" />
                <span>
                  <strong>Venue:</strong> {agreement.venue}, {agreement.city}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <CalendarDays size={15} className="mt-0.5 shrink-0 text-royalMaroon" aria-hidden="true" />
                <span>
                  <strong>Dates:</strong> {formatDate(agreement.startDate)} –{' '}
                  {formatDate(agreement.endDate)}
                </span>
              </p>
              <p>
                <strong>Expected guests:</strong> {agreement.guestCount}
              </p>
              <p>
                <strong>Selected service package:</strong> {agreement.packageType}
              </p>
            </div>
          </section>

          <section className="agreement-section mb-6">
            <h2 className="mb-3 border-b border-champagneGold/60 pb-2 font-serif text-base font-bold text-royalMaroon">
              03. Scope of services
            </h2>
            <p className="mb-3 text-sm leading-6 text-slateNavy/80">
              The selected planning package is intended to include the following
              coordination services, subject to a final event brief and written review:
            </p>
            <ul className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {services.map((service) => (
                <li key={service} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagneGold" />
                  {service}
                </li>
              ))}
            </ul>
          </section>

          <section className="agreement-section mb-6">
            <h2 className="mb-3 border-b border-champagneGold/60 pb-2 font-serif text-base font-bold text-royalMaroon">
              04. Commercial terms
            </h2>
            <div className="mb-3 flex items-center justify-between border border-champagneGold/40 bg-creamIvory px-4 py-3">
              <span className="text-sm font-semibold text-slateNavy">
                Total agreement value
              </span>
              <span className="font-serif text-lg font-bold text-royalMaroonDark">
                {moneyFormatter.format(agreement.contractValue)}
              </span>
            </div>
            <div className="overflow-hidden border border-slate-200">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.label}
                  className={`flex justify-between gap-4 px-4 py-2.5 text-sm ${
                    index < milestones.length - 1 ? 'border-b border-slate-200' : ''
                  }`}
                >
                  <span>{milestone.label}</span>
                  <strong className="whitespace-nowrap text-royalMaroonDark">
                    {moneyFormatter.format(milestone.amount)}
                  </strong>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-4 text-slateNavy/60">
              Milestone amounts are calculated from the displayed contract value
              for demonstration only. Timing and final commercial terms require review.
            </p>
          </section>

          <section className="agreement-section mb-6">
            <h2 className="mb-3 border-b border-champagneGold/60 pb-2 font-serif text-base font-bold text-royalMaroon">
              05. Terms and conditions
            </h2>
            <ol className="space-y-3">
              {terms.map((term, index) => (
                <li key={term.title} className="text-sm leading-5">
                  <p className="font-semibold text-royalMaroonDark">
                    {index + 1}. {term.title}
                  </p>
                  <p className="mt-1 text-slateNavy/75">{term.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="agreement-section mb-6">
            <h2 className="mb-3 border-b border-champagneGold/60 pb-2 font-serif text-base font-bold text-royalMaroon">
              06. Acknowledgement and signatures
            </h2>
            <p className="mb-5 text-xs leading-5 text-slateNavy/70">
              This signature area is part of a frontend demonstration. It is not
              a representation that this prototype has been approved for execution.
            </p>
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-semibold text-slateNavy">Agency representative</p>
                <p className="mt-1 text-xs text-slateNavy/65">The Royal Knot</p>
                <p className="mt-1 text-xs text-slateNavy/65">Date: __________________</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-semibold text-slateNavy">Client signature</p>
                {agreement.signatureData && (
                  <img
                    src={agreement.signatureData}
                    alt={`Signature of ${agreement.clientName}`}
                    className="my-1 h-12 max-w-48 object-contain object-left"
                  />
                )}
                <p className="mt-1 text-xs text-slateNavy/65">
                  Name: {agreement.clientName}
                </p>
                <p className="mt-1 text-xs text-slateNavy/65">
                  Date: {formatDate(agreement.signatureDate)}
                </p>
                <p className="mt-1 text-xs font-semibold text-royalMaroon">
                  Status: {agreement.status}
                </p>
              </div>
            </div>
          </section>

          <footer className="mt-8 border-t-2 border-champagneGold pt-3 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-royalMaroonDark">
              <Building2 size={12} aria-hidden="true" />
              THE ROYAL KNOT · JAIPUR · UDAIPUR · JODHPUR
            </p>
            <p className="mt-1 text-[9px] text-slateNavy/55">
              Demonstration document · Prepared {formatDate(agreement.createdAt)}
            </p>
          </footer>
        </article>
      </div>
    </motion.div>
  )
}

export default AgreementPreview
