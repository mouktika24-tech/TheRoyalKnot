import { motion } from 'framer-motion'
import {
  Check,
  CircleCheck,
  Clock3,
  Crown,
  MapPin,
  Minus,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { menuSections, serviceLabels } from '../../data/mockQuotes.js'
import { calculateQuote } from '../../utils/quoteCalculations.js'

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const statusStyles = {
  PENDING: 'border-champagneGold/70 bg-champagneGoldLight/45 text-royalMaroonDark',
  AWARDED: 'border-emeraldSuccess/40 bg-emeraldSuccess/10 text-emerald-800',
  CLOSED: 'border-slate-300 bg-slate-100 text-slate-600',
}

function StatusBadge({ status }) {
  const Icon = status === 'AWARDED' ? CircleCheck : status === 'PENDING' ? Clock3 : X

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.07em] ${statusStyles[status]}`}
    >
      <Icon size={12} aria-hidden="true" />
      {status}
    </span>
  )
}

function QuoteComparisonCard({
  quote,
  index,
  recommendation,
  isGroupAwarded,
  onViewDetails,
  onAward,
}) {
  const { baseAmount, gstAmount, finalTotal } = calculateQuote(quote)
  const isLowest = recommendation.lowestQuoteId === quote.id
  const isBestValue = recommendation.bestValueQuoteId === quote.id
  const canAward = quote.status === 'PENDING' && !isGroupAwarded

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className={`relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-white shadow-sm ${
        isBestValue
          ? 'border-2 border-champagneGold shadow-md'
          : 'border-slate-200'
      }`}
    >
      {isBestValue && (
        <div className="flex items-center justify-center gap-1.5 bg-royalMaroonDark px-3 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-champagneGoldLight">
          <Sparkles size={12} aria-hidden="true" />
          Indicative best value · {recommendation.scores[quote.id]}/100
        </div>
      )}
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-champagneGold/50 bg-creamIvory font-serif text-sm font-bold text-royalMaroon">
              {quote.initials}
            </span>
            <div className="min-w-0">
              <p className="break-words font-serif text-base font-semibold leading-5 text-royalMaroonDark">
                {quote.vendorName}
              </p>
              <p className="mt-1 text-[10px] font-medium tracking-[0.08em] text-slateNavy/55">
                REF · {quote.quoteRef}
              </p>
            </div>
          </div>
          <StatusBadge status={quote.status} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-creamIvory px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slateNavy/70">
            <Star size={14} className="fill-champagneGold text-champagneGold" aria-hidden="true" />
            {quote.rating.toFixed(1)}
            <span className="text-[10px] text-slateNavy/50">(sample rating)</span>
          </span>
          <span className="inline-flex items-center gap-1 text-slateNavy/65">
            <MapPin size={13} aria-hidden="true" />
            {quote.category}
          </span>
        </div>

        <section aria-label={`Pricing from ${quote.vendorName}`}>
          <div className="flex items-end justify-between gap-2 border-b border-champagneGold/30 pb-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slateNavy/55">
                Final quotation total
              </p>
              <p className="mt-1 font-serif text-2xl font-bold text-royalMaroonDark">
                {moneyFormatter.format(finalTotal)}
              </p>
            </div>
            {isLowest && (
              <span className="mb-1 inline-flex shrink-0 items-center gap-1 rounded-full border border-emeraldSuccess/30 bg-emeraldSuccess/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-800">
                <Crown size={11} aria-hidden="true" />
                Lowest
              </span>
            )}
          </div>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-slateNavy/65">Price per plate</dt>
              <dd className="font-medium">{moneyFormatter.format(quote.pricePerPlate)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slateNavy/65">Estimated guests</dt>
              <dd className="font-medium">{quote.estimatedGuestCount}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slateNavy/65">Base quotation</dt>
              <dd className="font-medium">{moneyFormatter.format(baseAmount)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slateNavy/65">GST ({quote.gstRate * 100}%)</dt>
              <dd className="font-medium">{moneyFormatter.format(gstAmount)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slateNavy/65">Additional charges</dt>
              <dd className="font-medium">{moneyFormatter.format(quote.additionalCharges)}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-royalMaroon">
            Menu comparison
          </h3>
          <div className="space-y-2.5">
            {menuSections.map(({ key, label }) => (
              <div key={key}>
                <p className="text-[10px] font-semibold text-slateNavy/70">{label}</p>
                <ul className="mt-1 flex flex-wrap gap-1">
                  {quote.menu[key].map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-slate-200 bg-slateLight px-2 py-0.5 text-[10px] leading-4 text-slateNavy/80"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-100 pt-3">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-royalMaroon">
            Included services
          </h3>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {serviceLabels.map(({ key, label }) => {
              const included = quote.services[key]
              const Icon = included ? Check : Minus

              return (
                <li
                  key={key}
                  className={`flex min-w-0 items-start gap-1.5 text-[10px] leading-4 ${
                    included ? 'text-slateNavy/80' : 'text-slateNavy/45'
                  }`}
                >
                  <Icon
                    size={13}
                    className={`mt-0.5 shrink-0 ${included ? 'text-emeraldSuccess' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-3 text-xs">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-royalMaroon">
            Commercial terms
          </h3>
          <p>
            <span className="text-slateNavy/65">Advance:</span>{' '}
            <strong>{quote.commercialTerms.advancePercentage}%</strong>
          </p>
          <p className="mt-1 text-slateNavy/70">
            {quote.commercialTerms.milestones.join(' · ')}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-slateNavy/65">
            <Clock3 size={12} aria-hidden="true" />
            {quote.commercialTerms.validity}
          </p>
        </section>

        <div className="mt-auto grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onViewDetails(quote)}
            className="min-h-10 rounded-md border border-royalMaroon/30 px-3 text-xs font-semibold text-royalMaroon transition hover:bg-creamIvory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
          >
            View details
          </button>
          <button
            type="button"
            onClick={() => onAward(quote)}
            disabled={!canAward}
            className="min-h-10 rounded-md bg-royalMaroon px-3 text-xs font-semibold text-white transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          >
            {quote.status === 'AWARDED'
              ? 'Awarded'
              : quote.status === 'CLOSED' || isGroupAwarded
                ? 'Quotation closed'
                : 'Award vendor'}
          </button>
        </div>
        {isGroupAwarded && quote.status === 'PENDING' && (
          <p className="-mt-2 flex items-center gap-1 text-[10px] text-slateNavy/60">
            <ShieldCheck size={12} aria-hidden="true" />
            Another quotation in this group has been awarded.
          </p>
        )}
      </div>
    </motion.article>
  )
}

function QuoteComparisonMatrix({
  quotes,
  recommendation,
  isGroupAwarded,
  onViewDetails,
  onAward,
}) {
  if (quotes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-champagneGold/60 bg-white px-5 py-12 text-center">
        <p className="font-serif text-xl font-semibold text-royalMaroonDark">
          No quotations match these filters
        </p>
        <p className="mt-2 text-sm text-slateNavy/65">
          Adjust the search or status filter to see this wedding’s catering proposals.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-start gap-3 rounded-lg border border-champagneGold/30 bg-champagneGoldLight/20 px-4 py-3 text-xs leading-5 text-slateNavy/75">
        <Sparkles
          size={16}
          className="mt-0.5 shrink-0 text-royalMaroon"
          aria-hidden="true"
        />
        <p>
          <strong className="text-royalMaroonDark">Indicative best value</strong>{' '}
          weighs menu breadth (30%, capped at 24 included items), included
          services (30%), and price relative to the lowest final total (40%).
          Both indicators use all quotations in
          this wedding/category group, not just the current search or status
          results; recommendations are sample-data comparisons, not guarantees.
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        {quotes.map((quote, index) => (
          <QuoteComparisonCard
            key={quote.id}
            quote={quote}
            index={index}
            recommendation={recommendation}
            isGroupAwarded={isGroupAwarded}
            onViewDetails={onViewDetails}
            onAward={onAward}
          />
        ))}
      </div>
    </>
  )
}

export default QuoteComparisonMatrix
