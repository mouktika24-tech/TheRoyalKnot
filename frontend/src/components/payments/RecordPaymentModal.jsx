import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, IndianRupee, X } from 'lucide-react'
import { formatCurrency } from '../../utils/currency.js'
import { calculateMilestones, getTodayDate } from '../../utils/paymentCalculations.js'

const paymentMethods = ['Bank Transfer', 'UPI', 'Cheque', 'Cash']

const fieldClassName =
  'min-h-11 w-full rounded-md border border-champagneGold/50 bg-white px-3 text-sm text-slateNavy outline-none transition focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15'

function RecordPaymentModal({
  weddings,
  payments,
  defaultWeddingId,
  defaultMilestoneId,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    weddingId: defaultWeddingId || weddings[0]?.id || '',
    milestoneId: defaultMilestoneId || 'booking',
    amount: '',
    paymentDate: getTodayDate(),
    method: '',
    referenceId: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const submitting = useRef(false)

  const selectedWedding = weddings.find((wedding) => wedding.id === form.weddingId)
  const milestones = useMemo(
    () =>
      selectedWedding
        ? calculateMilestones(selectedWedding, payments)
        : [],
    [payments, selectedWedding],
  )
  const selectedMilestone = milestones.find(
    (milestone) => milestone.id === form.milestoneId,
  )

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'weddingId' ? { milestoneId: 'booking' } : {}),
    }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (submitting.current) return

    const nextErrors = {}
    const amount = Number(form.amount)

    if (!form.weddingId) nextErrors.weddingId = 'Select a wedding.'
    if (!form.milestoneId || !selectedMilestone) {
      nextErrors.milestoneId = 'Select a milestone.'
    }
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      nextErrors.amount = 'Enter a payment amount greater than zero.'
    } else if (!Number.isInteger(amount)) {
      nextErrors.amount = 'Enter a whole-rupee amount.'
    } else if (selectedMilestone && amount > selectedMilestone.remaining) {
      nextErrors.amount = 'Payment cannot exceed the remaining milestone balance.'
    }
    if (!form.paymentDate) nextErrors.paymentDate = 'Select a payment date.'
    if (!form.method) nextErrors.method = 'Select a payment method.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    submitting.current = true
    onSubmit({
      weddingId: form.weddingId,
      milestoneId: form.milestoneId,
      amount,
      paymentDate: form.paymentDate,
      method: form.method,
      referenceId: form.referenceId.trim(),
      notes: form.notes.trim(),
    })
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slateNavy/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-payment-title"
        className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-creamIvory shadow-2xl sm:rounded-2xl"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <header className="flex items-start justify-between border-b border-champagneGold/35 px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-royalMaroon">
              Client collections · Local prototype
            </p>
            <h2
              id="record-payment-title"
              className="mt-1 font-serif text-2xl font-semibold text-royalMaroonDark"
            >
              Record a payment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-slateNavy/65 transition hover:bg-champagneGoldLight/50 hover:text-royalMaroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
            aria-label="Close record payment"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate className="overflow-y-auto">
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slateNavy">Wedding *</span>
              <select
                name="weddingId"
                value={form.weddingId}
                onChange={updateField}
                className={fieldClassName}
                aria-invalid={Boolean(errors.weddingId)}
                aria-describedby={errors.weddingId ? 'payment-wedding-error' : undefined}
              >
                {weddings.map((wedding) => (
                  <option key={wedding.id} value={wedding.id}>
                    {wedding.weddingName} · {wedding.clientName}
                  </option>
                ))}
              </select>
              {errors.weddingId && (
                <span id="payment-wedding-error" className="mt-1 block text-xs text-rubyDanger">
                  {errors.weddingId}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slateNavy">Milestone *</span>
              <select
                name="milestoneId"
                value={form.milestoneId}
                onChange={updateField}
                className={fieldClassName}
                aria-invalid={Boolean(errors.milestoneId)}
                aria-describedby={errors.milestoneId ? 'payment-milestone-error' : undefined}
              >
                {milestones.map((milestone) => (
                  <option
                    key={milestone.id}
                    value={milestone.id}
                    disabled={milestone.remaining === 0}
                  >
                    {milestone.name} · {milestone.percentage}%
                  </option>
                ))}
              </select>
              {errors.milestoneId && (
                <span id="payment-milestone-error" className="mt-1 block text-xs text-rubyDanger">
                  {errors.milestoneId}
                </span>
              )}
            </label>

            <div className="sm:col-span-2">
              {selectedMilestone && (
                <dl className="grid gap-2 rounded-lg border border-champagneGold/35 bg-white p-3 text-xs sm:grid-cols-3 sm:p-4">
                  <div>
                    <dt className="text-slateNavy/60">Milestone total</dt>
                    <dd className="mt-1 font-semibold text-royalMaroonDark">
                      {formatCurrency(selectedMilestone.amount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slateNavy/60">Already received</dt>
                    <dd className="mt-1 font-semibold text-slateNavy">
                      {formatCurrency(selectedMilestone.amountPaid)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slateNavy/60">Remaining balance</dt>
                    <dd className="mt-1 font-semibold text-royalMaroon">
                      {formatCurrency(selectedMilestone.remaining)}
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slateNavy">Payment amount (₹) *</span>
              <span className="relative block">
                <IndianRupee
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-royalMaroon"
                  aria-hidden="true"
                />
                <input
                  name="amount"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={form.amount}
                  onChange={updateField}
                  className={`${fieldClassName} pl-9 ${errors.amount ? 'border-rubyDanger focus:border-rubyDanger focus:ring-rubyDanger/15' : ''}`}
                  placeholder="e.g. 500000"
                  aria-invalid={Boolean(errors.amount)}
                  aria-describedby={errors.amount ? 'payment-amount-error' : undefined}
                />
              </span>
              {errors.amount && (
                <span id="payment-amount-error" className="mt-1 block text-xs text-rubyDanger">
                  {errors.amount}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slateNavy">Payment date *</span>
              <span className="relative block">
                <CalendarDays
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-royalMaroon"
                  aria-hidden="true"
                />
                <input
                  name="paymentDate"
                  type="date"
                  value={form.paymentDate}
                  onChange={updateField}
                  className={`${fieldClassName} pl-9 ${errors.paymentDate ? 'border-rubyDanger' : ''}`}
                  aria-invalid={Boolean(errors.paymentDate)}
                  aria-describedby={errors.paymentDate ? 'payment-date-error' : undefined}
                />
              </span>
              {errors.paymentDate && (
                <span id="payment-date-error" className="mt-1 block text-xs text-rubyDanger">
                  {errors.paymentDate}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slateNavy">Payment method *</span>
              <select
                name="method"
                value={form.method}
                onChange={updateField}
                className={`${fieldClassName} ${errors.method ? 'border-rubyDanger' : ''}`}
                aria-invalid={Boolean(errors.method)}
                aria-describedby={errors.method ? 'payment-method-error' : undefined}
              >
                <option value="">Select a method</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              {errors.method && (
                <span id="payment-method-error" className="mt-1 block text-xs text-rubyDanger">
                  {errors.method}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slateNavy">
                Transaction / reference ID
              </span>
              <input
                name="referenceId"
                value={form.referenceId}
                onChange={updateField}
                className={fieldClassName}
                placeholder="Bank or UPI reference"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-slateNavy">Notes (optional)</span>
              <textarea
                name="notes"
                rows="3"
                value={form.notes}
                onChange={updateField}
                className={`${fieldClassName} min-h-20 resize-y py-2.5`}
                placeholder="Add a note about this transaction"
              />
            </label>
          </div>

          <footer className="flex flex-col-reverse gap-2 border-t border-champagneGold/30 bg-white/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-md border border-slate-300 px-5 text-sm font-semibold text-slateNavy transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-royalMaroon px-5 text-sm font-semibold text-white transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon focus-visible:ring-offset-2"
            >
              <IndianRupee size={16} aria-hidden="true" />
              Save payment
            </button>
          </footer>
        </form>
      </motion.section>
    </motion.div>
  )
}

export default RecordPaymentModal
