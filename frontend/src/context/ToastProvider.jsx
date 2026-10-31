import { useCallback, useRef, useState } from 'react'
import { ToastViewport } from '../components/common/Toast.jsx'
import { getApiErrorDetails } from '../utils/apiError.js'
import { ToastContext } from './ToastContext.jsx'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismissToast = useCallback((id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    )
  }, [])

  const showToast = useCallback(
    ({ type = 'success', message, title, duration, fieldErrors }) => {
      if (!Object.hasOwn({ success: true, error: true, warning: true }, type)) {
        throw new Error(`Unsupported toast type: ${type}`)
      }
      if (!message) {
        throw new Error('Toast message is required')
      }

      const id = nextId.current + 1
      nextId.current = id
      setToasts((currentToasts) => [
        ...currentToasts,
        { id, type, message, title, duration, fieldErrors },
      ])
      return id
    },
    [],
  )

  const showApiError = useCallback(
    (error) => {
      const details = getApiErrorDetails(error)
      const isValidationError =
        error?.response?.status === 400 ||
        Boolean(error?.validation?.message || error?.validation?.fieldErrors)

      showToast({
        type: 'error',
        title: isValidationError ? 'Please check the form' : 'Request failed',
        message: details.validationMessage || details.apiMessage,
        fieldErrors: details.fieldErrors,
      })

      return details
    },
    [showToast],
  )

  return (
    <ToastContext.Provider value={{ showToast, showApiError }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}
