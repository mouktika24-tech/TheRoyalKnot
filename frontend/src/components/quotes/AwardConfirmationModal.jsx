import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Award, X } from 'lucide-react'
import { calculateQuote } from '../../utils/quoteCalculations.js'

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function AwardConfirmationModal({ quote, wedding, onClose, onConfirm }) {
  const total = calculateQuote(quote).finalTotal

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
            aria-labelledby="award-confirmation-title"
            className="w-full max-w-lg rounded-t-2xl bg-creamIvory shadow-2xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <header className="flex items-start justify-between border-b border-champagneGold/35 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-champagneGoldLight/50 text-royalMaroon">
                  <Award size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-royalMaroon">
                    Vendor selection
                  </p>
                  <h2
                    id="award-confirmation-title"
                    className="mt-1 font-serif text-xl font-semibold text-royalMaroonDark"
                  >
                    Award this quotation?
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-slateNavy/65 transition hover:bg-champagneGoldLight/50 hover:text-royalMaroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
                aria-label="Close award confirmation"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </header>

            <div className="space-y-4 px-5 py-5 sm:px-6">
              <div className="rounded-lg border border-champagneGold/40 bg-white p-4">
                <p className="font-serif text-lg font-semibold text-royalMaroonDark">
                  {quote.vendorName}
                </p>
                <p className="mt-1 text-xs text-slateNavy/65">
                  {quote.quoteRef} · {wedding.weddingName}
                </p>
                <p className="mt-3 font-serif text-xl font-bold text-royalMaroon">
                  {moneyFormatter.format(total)}
                </p>
              </div>

              <div
                className="flex gap-3 rounded-lg border border-champagneGold/50 bg-champagneGoldLight/30 p-4 text-sm leading-5 text-royalMaroonDark"
                role="alert"
              >
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-royalMaroon" aria-hidden="true" />
                <p>
                  Confirming this selection will mark this quote as awarded and
                  close the competing quotations for this wedding and category.
                  This prototype updates local page state only.
                </p>
              </div>
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-champagneGold/30 bg-white/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-md border border-slate-300 px-5 text-sm font-medium text-slateNavy transition hover:bg-slateLight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="min-h-11 rounded-md bg-royalMaroon px-5 text-sm font-semibold text-white transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon focus-visible:ring-offset-2"
              >
                Confirm award
              </button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AwardConfirmationModal
