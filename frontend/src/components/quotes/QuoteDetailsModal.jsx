import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock3, MapPin, X } from 'lucide-react'
import { menuSections, serviceLabels } from '../../data/mockQuotes.js'
import { calculateQuote } from '../../utils/quoteCalculations.js'

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function QuoteDetailsModal({ quote, wedding, onClose }) {
  const { baseAmount, gstAmount, finalTotal } = calculateQuote(quote)

  useEffect(() => {
    if (!quote) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, quote])

  return (
    <AnimatePresence>
      {quote && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center bg-slateNavy/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-details-title"
            className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-creamIvory shadow-2xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <header className="flex items-start justify-between border-b border-champagneGold/35 px-5 py-4 sm:px-7">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-royalMaroon">
                  Quotation details · {quote.quoteRef}
                </p>
                <h2
                  id="quote-details-title"
                  className="mt-1 font-serif text-2xl font-semibold text-royalMaroonDark"
                >
                  {quote.vendorName}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slateNavy/65">
                  <MapPin size={13} aria-hidden="true" />
                  {wedding.weddingName} · {wedding.city}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-slateNavy/65 transition hover:bg-champagneGoldLight/50 hover:text-royalMaroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
                aria-label="Close quotation details"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </header>

            <div className="overflow-y-auto px-5 py-5 sm:px-7">
              <section>
                <h3 className="font-serif text-lg font-semibold text-royalMaroonDark">
                  Pricing breakdown
                </h3>
                <dl className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white px-4">
                  {[
                    ['Price per plate', moneyFormatter.format(quote.pricePerPlate)],
                    ['Estimated guest count', quote.estimatedGuestCount.toLocaleString('en-IN')],
                    ['Base quotation', moneyFormatter.format(baseAmount)],
                    [`GST (${quote.gstRate * 100}%)`, moneyFormatter.format(gstAmount)],
                    ['Additional charges', moneyFormatter.format(quote.additionalCharges)],
                    ['Final quotation total', moneyFormatter.format(finalTotal)],
                  ].map(([label, amount], index) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between gap-4 py-3 text-sm ${
                        index === 5 ? 'font-semibold text-royalMaroonDark' : ''
                      }`}
                    >
                      <dt className={index === 5 ? '' : 'text-slateNavy/70'}>{label}</dt>
                      <dd className="shrink-0">{amount}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="mt-6">
                <h3 className="font-serif text-lg font-semibold text-royalMaroonDark">
                  Menu inclusions
                </h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {menuSections.map(({ key, label }) => (
                    <div key={key} className="rounded-lg border border-slate-200 bg-white p-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-royalMaroon">
                        {label}
                      </h4>
                      <ul className="mt-2 space-y-1.5">
                        {quote.menu[key].map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs text-slateNavy/80">
                            <Check size={13} className="mt-0.5 shrink-0 text-emeraldSuccess" aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <h3 className="font-serif text-lg font-semibold text-royalMaroonDark">
                  Additional services
                </h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {serviceLabels.map(({ key, label }) => (
                    <li
                      key={key}
                      className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      {quote.services[key] ? (
                        <Check size={14} className="text-emeraldSuccess" aria-hidden="true" />
                      ) : (
                        <X size={14} className="text-slateNavy/35" aria-hidden="true" />
                      )}
                      <span className={quote.services[key] ? 'text-slateNavy' : 'text-slateNavy/55'}>
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-6 rounded-lg border border-champagneGold/35 bg-white p-4">
                <h3 className="font-serif text-lg font-semibold text-royalMaroonDark">
                  Payment terms &amp; validity
                </h3>
                <p className="mt-3 text-sm">
                  Advance payment: <strong>{quote.commercialTerms.advancePercentage}%</strong>
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slateNavy/75">
                  {quote.commercialTerms.milestones.map((milestone) => (
                    <li key={milestone}>{milestone}</li>
                  ))}
                </ul>
                <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slateNavy">
                  <Clock3 size={14} className="text-royalMaroon" aria-hidden="true" />
                  {quote.commercialTerms.validity}
                </p>
                <p className="mt-3 text-xs leading-5 text-slateNavy/75">
                  <strong className="text-slateNavy">Sample cancellation wording:</strong>{' '}
                  {quote.commercialTerms.cancellation}
                </p>
              </section>

              <section className="mt-6 rounded-lg bg-champagneGoldLight/25 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-royalMaroon">
                  Notes and special conditions
                </h3>
                <p className="mt-2 text-sm leading-6 text-slateNavy/80">{quote.notes}</p>
                <p className="mt-2 text-[10px] leading-4 text-slateNavy/55">
                  All quotation details are temporary sample data for this frontend prototype.
                </p>
              </section>
            </div>

            <footer className="border-t border-champagneGold/30 bg-white/70 px-5 py-3 text-right sm:px-7">
              <button
                type="button"
                onClick={onClose}
                className="min-h-10 rounded-md border border-slate-300 px-5 text-sm font-medium text-slateNavy transition hover:bg-slateLight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
              >
                Close
              </button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default QuoteDetailsModal
