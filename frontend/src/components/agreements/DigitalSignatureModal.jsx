import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Eraser, FileSignature, X } from 'lucide-react'

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 400

function getPointerPosition(event, canvas) {
  const bounds = canvas.getBoundingClientRect()

  return {
    x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
  }
}

function localDateString() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function DigitalSignatureModal({ agreement, onClose, onSign }) {
  const canvasRef = useRef(null)
  const lastPointRef = useRef(null)
  const activePointerRef = useRef(null)
  const hasSignatureRef = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    hasSignatureRef.current = false
    setHasSignature(false)
    setError('')
  }, [agreement])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handlePointerDown(event) {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || !event.isPrimary) return

    event.preventDefault()
    canvas.setPointerCapture(event.pointerId)
    activePointerRef.current = event.pointerId

    const point = getPointerPosition(event, canvas)
    lastPointRef.current = point
    context.beginPath()
    context.moveTo(point.x, point.y)
    context.arc(point.x, point.y, 1.5, 0, Math.PI * 2)
    context.fillStyle = '#4A1D24'
    context.fill()
    context.beginPath()
    context.moveTo(point.x, point.y)
    context.strokeStyle = '#4A1D24'
    context.lineWidth = Math.max(3, canvas.width / 400)
    hasSignatureRef.current = true
    setHasSignature(true)
    setError('')
  }

  function handlePointerMove(event) {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (
      !canvas ||
      !context ||
      activePointerRef.current !== event.pointerId ||
      !lastPointRef.current
    ) {
      return
    }

    event.preventDefault()
    const point = getPointerPosition(event, canvas)
    const midpoint = {
      x: (lastPointRef.current.x + point.x) / 2,
      y: (lastPointRef.current.y + point.y) / 2,
    }

    context.quadraticCurveTo(
      lastPointRef.current.x,
      lastPointRef.current.y,
      midpoint.x,
      midpoint.y,
    )
    context.stroke()
    lastPointRef.current = point
  }

  function finishStroke(event) {
    if (activePointerRef.current !== event.pointerId) return

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    const point = canvas ? getPointerPosition(event, canvas) : null
    if (context && point && lastPointRef.current) {
      context.lineTo(point.x, point.y)
      context.stroke()
    }

    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    activePointerRef.current = null
    lastPointRef.current = null
  }

  function clearSignature() {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    hasSignatureRef.current = false
    setHasSignature(false)
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!canvasRef.current || !hasSignatureRef.current) {
      setError('Please add your signature before continuing.')
      return
    }

    onSign({
      signatureData: canvasRef.current.toDataURL('image/png'),
      signatureDate: localDateString(),
    })
  }

  return (
    <AnimatePresence>
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
          aria-labelledby="signature-title"
          className="w-full max-w-2xl overflow-hidden rounded-t-2xl bg-creamIvory shadow-2xl sm:rounded-2xl"
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.99 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <header className="flex items-start justify-between border-b border-champagneGold/35 px-5 py-4 sm:px-7">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-royalMaroon">
                Digital signing
              </p>
              <h2
                id="signature-title"
                className="mt-1 font-serif text-2xl font-semibold text-royalMaroonDark"
              >
                Sign agreement
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-slateNavy/70 transition hover:bg-champagneGoldLight/50 hover:text-royalMaroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
              aria-label="Close signature dialog"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5 px-5 py-5 sm:px-7">
              <div className="rounded-lg border border-champagneGold/40 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slateNavy/55">
                      Agreement
                    </p>
                    <p className="mt-1 font-semibold text-royalMaroonDark">
                      {agreement.agreementId}
                    </p>
                  </div>
                  <p className="text-right text-sm font-medium text-slateNavy">
                    {agreement.clientName}
                  </p>
                </div>
                <p className="mt-3 border-t border-slate-100 pt-3 font-serif text-base text-slateNavy">
                  {agreement.coupleNames}
                </p>
                <p className="mt-1 text-xs text-slateNavy/65">
                  {agreement.city} · {agreement.venue}
                </p>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="agreement-signature"
                    className="text-sm font-semibold text-slateNavy"
                  >
                    Please sign within the box below.
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-royalMaroon transition hover:bg-champagneGoldLight/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
                  >
                    <Eraser size={14} aria-hidden="true" />
                    Clear signature
                  </button>
                </div>

                <div
                  className={`overflow-hidden rounded-lg border bg-white ${error ? 'border-rubyDanger' : 'border-champagneGold/55'}`}
                >
                  <canvas
                    ref={canvasRef}
                    id="agreement-signature"
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="block aspect-[3/1] w-full cursor-crosshair touch-none"
                    style={{ touchAction: 'none' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finishStroke}
                    onPointerCancel={finishStroke}
                    aria-label="Signature drawing area"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slateNavy/55">
                  <span>Use your mouse, finger or stylus</span>
                  <span>{hasSignature ? 'Signature added' : 'Signature required'}</span>
                </div>
                {error && (
                  <p className="mt-2 text-xs text-rubyDanger" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <p className="text-xs leading-5 text-slateNavy/60">
                This signature pad is a local frontend demonstration. Signature
                data is held only in the current page state.
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
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-royalMaroon px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon focus-visible:ring-offset-2"
              >
                <FileSignature size={16} aria-hidden="true" />
                <Check size={15} aria-hidden="true" />
                Sign agreement
              </button>
            </footer>
          </form>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  )
}

export default DigitalSignatureModal
