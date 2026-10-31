import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, CircleX, TriangleAlert, X } from 'lucide-react'

const toastStyles = {
  success: {
    icon: CircleCheck,
    title: 'Success',
    classes: 'border-emeraldSuccess/40 bg-emeraldSuccess/10 text-emerald-950',
    iconClass: 'text-emeraldSuccess',
  },
  error: {
    icon: CircleX,
    title: 'Error',
    classes: 'border-rubyDanger/40 bg-rubyDanger/10 text-rose-950',
    iconClass: 'text-rubyDanger',
  },
  warning: {
    icon: TriangleAlert,
    title: 'Warning',
    classes: 'border-champagneGold/60 bg-champagneGoldLight/50 text-royalMaroonDark',
    iconClass: 'text-royalMaroon',
  },
}

function Toast({ toast, onDismiss }) {
  const { id, type, title, message, duration = 5000, fieldErrors = {} } = toast
  const style = toastStyles[type]
  const Icon = style.icon

  useEffect(() => {
    if (duration <= 0) return undefined

    const timeoutId = window.setTimeout(() => onDismiss(id), duration)
    return () => window.clearTimeout(timeoutId)
  }, [duration, id, onDismiss])

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg ${style.classes}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`mt-0.5 shrink-0 ${style.iconClass}`}
          size={20}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title || style.title}</p>
          <p className="mt-1 break-words text-sm">{message}</p>
          {Object.keys(fieldErrors).length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              {Object.entries(fieldErrors).map(([field, error]) => (
                <li key={field}>
                  <span className="font-medium">{field}:</span> {String(error)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="-mr-2 -mt-2 inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-md opacity-75 outline-none transition hover:bg-black/5 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-royalMaroon"
          aria-label={`Dismiss ${title || style.title} notification`}
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    </motion.li>
  )
}

export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 px-3 sm:left-auto sm:right-4 sm:top-4 sm:w-full sm:max-w-sm sm:px-0">
      <AnimatePresence initial={false}>
        <motion.ol
          layout
          className="flex max-h-[calc(100vh-1.5rem)] flex-col gap-3 overflow-y-auto"
          aria-label="Notifications"
        >
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
          ))}
        </motion.ol>
      </AnimatePresence>
    </div>
  )
}

export default Toast
