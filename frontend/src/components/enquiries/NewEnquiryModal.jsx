import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IndianRupee, X } from 'lucide-react'

const initialForm = {
  clientName: '',
  email: '',
  phone: '',
  coupleName: '',
  city: 'Jaipur',
  venue: '',
  packageType: 'Full-Service',
  startDate: '',
  endDate: '',
  guests: '',
  budget: '',
}

const requiredFields = [
  'clientName',
  'email',
  'phone',
  'coupleName',
  'city',
  'venue',
  'packageType',
  'startDate',
  'endDate',
  'guests',
  'budget',
]

const fieldLabels = {
  clientName: 'Client name',
  email: 'Email',
  phone: 'Phone',
  coupleName: 'Couple name',
  city: 'Wedding city',
  venue: 'Venue',
  packageType: 'Package type',
  startDate: 'Wedding start date',
  endDate: 'Wedding end date',
  guests: 'Expected guests',
  budget: 'Estimated budget',
}

const fieldClassName =
  'mt-1.5 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slateNavy outline-none transition placeholder:text-slate-400 focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15'

function validateForm(form) {
  const errors = {}

  for (const field of requiredFields) {
    if (!String(form[field]).trim()) {
      errors[field] = `${fieldLabels[field]} is required.`
    }
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  const normalizedPhone = form.phone.replace(/\s/g, '').replace(/^\+91/, '')
  if (form.phone && !/^[6-9]\d{9}$/.test(normalizedPhone)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.'
  }

  const guests = Number(form.guests)
  if (form.guests && (!Number.isInteger(guests) || guests < 100)) {
    errors.guests = 'Expected guest count must be at least 100.'
  }

  const budget = Number(form.budget)
  if (form.budget && (budget < 2500000 || budget > 50000000)) {
    errors.budget = 'Budget must be between ₹25 lakh and ₹5 crore.'
  }

  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = 'End date cannot be before the start date.'
  }

  return errors
}

function Field({ name, label, error, required = false, children, ...props }) {
  const errorId = `${name}-error`

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slateNavy"
      >
        {label}
        {required && <span className="ml-1 text-rubyDanger" aria-hidden="true">*</span>}
      </label>
      {children || (
        <input
          id={name}
          name={name}
          className={`${fieldClassName} ${error ? 'border-rubyDanger focus:border-rubyDanger focus:ring-rubyDanger/15' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-rubyDanger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function NewEnquiryModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setErrors((currentErrors) => {
      if (!currentErrors[name]) return currentErrors
      const nextErrors = { ...currentErrors }
      delete nextErrors[name]
      return nextErrors
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      clientName: form.clientName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      coupleName: form.coupleName.trim(),
      city: form.city,
      venue: form.venue.trim(),
      packageType: form.packageType,
      startDate: form.startDate,
      endDate: form.endDate,
      guests: Number(form.guests),
      budget: Number(form.budget),
    })
    setForm(initialForm)
    setErrors({})
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center bg-slateNavy/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
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
            aria-labelledby="new-enquiry-title"
            className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-creamIvory shadow-2xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <header className="flex items-start justify-between border-b border-champagneGold/30 px-5 py-4 sm:px-7">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-royalMaroon">
                  Begin the celebration
                </p>
                <h2
                  id="new-enquiry-title"
                  className="mt-1 font-serif text-2xl font-semibold text-royalMaroonDark"
                >
                  New wedding enquiry
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-slateNavy/70 outline-none transition hover:bg-champagneGoldLight/50 hover:text-royalMaroon focus-visible:ring-2 focus-visible:ring-royalMaroon"
                aria-label="Close new enquiry form"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={handleSubmit} noValidate className="overflow-y-auto">
              <div className="grid gap-x-5 gap-y-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
                <Field
                  name="clientName"
                  label="Client name"
                  autoComplete="name"
                  value={form.clientName}
                  onChange={handleChange}
                  error={errors.clientName}
                  required
                />
                <Field
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />
                <Field
                  name="phone"
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  required
                />
                <Field
                  name="coupleName"
                  label="Couple name"
                  value={form.coupleName}
                  onChange={handleChange}
                  error={errors.coupleName}
                  required
                />
                <Field
                  name="city"
                  label="Wedding city"
                  error={errors.city}
                  required
                >
                  <select
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className={fieldClassName}
                    aria-invalid={Boolean(errors.city)}
                  >
                    <option>Jaipur</option>
                    <option>Udaipur</option>
                    <option>Jodhpur</option>
                  </select>
                </Field>
                <Field
                  name="venue"
                  label="Venue"
                  value={form.venue}
                  onChange={handleChange}
                  error={errors.venue}
                  required
                />
                <Field
                  name="packageType"
                  label="Package type"
                  error={errors.packageType}
                  required
                >
                  <select
                    id="packageType"
                    name="packageType"
                    value={form.packageType}
                    onChange={handleChange}
                    className={fieldClassName}
                  >
                    <option>Full-Service</option>
                    <option>Day-of Coordination</option>
                  </select>
                </Field>
                <Field
                  name="startDate"
                  label="Wedding start date"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  error={errors.startDate}
                  required
                />
                <Field
                  name="endDate"
                  label="Wedding end date"
                  type="date"
                  min={form.startDate || undefined}
                  value={form.endDate}
                  onChange={handleChange}
                  error={errors.endDate}
                  required
                />
                <Field
                  name="guests"
                  label="Expected guests"
                  type="number"
                  min="100"
                  step="1"
                  placeholder="Minimum 100"
                  value={form.guests}
                  onChange={handleChange}
                  error={errors.guests}
                  required
                />
                <Field
                  name="budget"
                  label="Estimated budget"
                  type="number"
                  min="2500000"
                  max="50000000"
                  step="100000"
                  placeholder="₹25,00,000 – ₹5,00,00,000"
                  value={form.budget}
                  onChange={handleChange}
                  error={errors.budget}
                  required
                />
                <p className="flex items-center gap-2 text-xs text-slateNavy/60 sm:col-span-2">
                  <IndianRupee size={14} aria-hidden="true" />
                  Budget range: ₹25 lakh to ₹5 crore
                </p>
              </div>

              <footer className="flex flex-col-reverse gap-3 border-t border-champagneGold/30 bg-white/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-11 rounded-md border border-slate-300 px-5 text-sm font-medium text-slateNavy transition hover:bg-slateLight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-11 rounded-md bg-royalMaroon px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon focus-visible:ring-offset-2"
                >
                  Add enquiry
                </button>
              </footer>
            </form>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NewEnquiryModal
