import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

const fieldClassName =
  'mt-1.5 block min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slateNavy outline-none transition focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15'

function ConsultationModal({ isOpen, enquiry, onClose, onSubmit }) {
  const [form, setForm] = useState(() =>
    enquiry?.consultation
      ? { ...enquiry.consultation }
      : { date: '', time: '', meetingType: 'In-person', notes: '' },
  )
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
    const nextErrors = {}
    if (!form.date) nextErrors.date = 'Consultation date is required.'
    if (!form.time) nextErrors.time = 'Consultation time is required.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      date: form.date,
      time: form.time,
      meetingType: form.meetingType,
      notes: form.notes.trim(),
    })
  }

  return (
    <AnimatePresence>
      {isOpen && enquiry && (
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
            aria-labelledby="consultation-title"
            className="w-full max-w-lg rounded-t-2xl bg-creamIvory shadow-2xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 20, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <header className="flex items-start justify-between border-b border-champagneGold/30 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-royalMaroon">
                  A conversation to begin
                </p>
                <h2
                  id="consultation-title"
                  className="mt-1 font-serif text-2xl font-semibold text-royalMaroonDark"
                >
                  Schedule consultation
                </h2>
                <p className="mt-1 text-sm text-slateNavy/70">
                  {enquiry.coupleName} · {enquiry.city}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-slateNavy/70 outline-none transition hover:bg-champagneGoldLight/50 hover:text-royalMaroon focus-visible:ring-2 focus-visible:ring-royalMaroon"
                aria-label="Close consultation form"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4 px-5 py-5 sm:px-6">
                <div>
                  <label
                    htmlFor="consultation-date"
                    className="block text-sm font-medium text-slateNavy"
                  >
                    Consultation date
                    <span className="ml-1 text-rubyDanger" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="consultation-date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    className={`${fieldClassName} ${errors.date ? 'border-rubyDanger' : ''}`}
                    aria-invalid={Boolean(errors.date)}
                    aria-describedby={errors.date ? 'consultation-date-error' : undefined}
                  />
                  {errors.date && (
                    <p
                      id="consultation-date-error"
                      className="mt-1 text-xs text-rubyDanger"
                      role="alert"
                    >
                      {errors.date}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="consultation-time"
                    className="block text-sm font-medium text-slateNavy"
                  >
                    Consultation time
                    <span className="ml-1 text-rubyDanger" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="consultation-time"
                    name="time"
                    type="time"
                    value={form.time}
                    onChange={handleChange}
                    className={`${fieldClassName} ${errors.time ? 'border-rubyDanger' : ''}`}
                    aria-invalid={Boolean(errors.time)}
                    aria-describedby={errors.time ? 'consultation-time-error' : undefined}
                  />
                  {errors.time && (
                    <p
                      id="consultation-time-error"
                      className="mt-1 text-xs text-rubyDanger"
                      role="alert"
                    >
                      {errors.time}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="meetingType"
                    className="block text-sm font-medium text-slateNavy"
                  >
                    Meeting type
                  </label>
                  <select
                    id="meetingType"
                    name="meetingType"
                    value={form.meetingType}
                    onChange={handleChange}
                    className={fieldClassName}
                  >
                    <option>In-person</option>
                    <option>Video Call</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="consultation-notes"
                    className="block text-sm font-medium text-slateNavy"
                  >
                    Notes <span className="font-normal text-slateNavy/60">(optional)</span>
                  </label>
                  <textarea
                    id="consultation-notes"
                    name="notes"
                    rows="3"
                    value={form.notes}
                    onChange={handleChange}
                    className={`${fieldClassName} resize-y`}
                    placeholder="Anything to prepare before the meeting?"
                  />
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
                  type="submit"
                  className="min-h-11 rounded-md bg-royalMaroon px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon focus-visible:ring-offset-2"
                >
                  Save consultation
                </button>
              </footer>
            </form>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConsultationModal
