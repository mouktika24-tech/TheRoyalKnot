import { useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  CircleDashed,
  FileCheck2,
  FileSignature,
  Search,
  X,
} from 'lucide-react'
import AnimatedCard from '../components/common/AnimatedCard.jsx'
import AgreementList from '../components/agreements/AgreementList.jsx'
import AgreementPreview from '../components/agreements/AgreementPreview.jsx'
import DigitalSignatureModal from '../components/agreements/DigitalSignatureModal.jsx'
import { initialAgreements } from '../data/mockAgreements.js'
import { useToast } from '../context/useToast.js'

const statusFilters = ['ALL', 'DRAFT', 'PENDING', 'SIGNED']

const statisticDetails = [
  { key: 'total', label: 'Total agreements', icon: FileCheck2, accent: 'text-royalMaroon' },
  { key: 'signed', label: 'Signed', icon: CheckCircle2, accent: 'text-emeraldSuccess' },
  { key: 'pending', label: 'Pending signature', icon: FileSignature, accent: 'text-champagneGold' },
  { key: 'draft', label: 'Draft', icon: CircleDashed, accent: 'text-slateNavy' },
]

function SigningSuccess({ agreement, onClose }) {
  if (!agreement) return null

  const date = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${agreement.signatureDate}T00:00:00Z`))

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slateNavy/55 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="signed-success-title"
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-champagneGold/50 bg-creamIvory px-6 pb-7 pt-8 text-center shadow-2xl sm:px-9"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-slateNavy/60 transition hover:bg-champagneGoldLight/50 hover:text-royalMaroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
            aria-label="Close signing confirmation"
          >
            <X size={18} aria-hidden="true" />
          </button>

          <motion.div
            initial={{ scale: 0.55, rotate: -16 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.12 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-[5px] border-double border-champagneGold bg-royalMaroonDark text-champagneGold shadow-[0_8px_24px_rgba(74,29,36,0.22)]"
            aria-hidden="true"
          >
            <div className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-champagneGold/60">
              <CheckCircle2 size={32} strokeWidth={1.6} />
            </div>
          </motion.div>

          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-royalMaroon">
            Signature recorded
          </p>
          <h2
            id="signed-success-title"
            className="mt-2 font-serif text-2xl font-semibold text-royalMaroonDark sm:text-3xl"
          >
            Agreement Successfully Signed
          </h2>
          <p className="mt-3 text-sm text-slateNavy/70">
            {agreement.clientName}’s signature has been added to the local
            agreement preview.
          </p>
          <div className="mt-5 rounded-lg border border-champagneGold/40 bg-white px-4 py-3">
            <p className="text-xs font-semibold tracking-[0.08em] text-royalMaroonDark">
              {agreement.agreementId}
            </p>
            <p className="mt-1 text-xs text-slateNavy/65">Signed {date}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 min-h-11 w-full rounded-md bg-royalMaroon px-5 text-sm font-semibold text-white transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon focus-visible:ring-offset-2"
          >
            Return to agreements
          </button>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  )
}

function Agreements() {
  const [agreements, setAgreements] = useState(initialAgreements)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [previewAgreement, setPreviewAgreement] = useState(null)
  const [signingAgreement, setSigningAgreement] = useState(null)
  const [signedSuccess, setSignedSuccess] = useState(null)
  const { showToast } = useToast()

  const statistics = useMemo(
    () => ({
      total: agreements.length,
      signed: agreements.filter((agreement) => agreement.status === 'SIGNED').length,
      pending: agreements.filter((agreement) => agreement.status === 'PENDING').length,
      draft: agreements.filter((agreement) => agreement.status === 'DRAFT').length,
    }),
    [agreements],
  )

  const visibleAgreements = useMemo(() => {
    const query = search.trim().toLowerCase()

    return agreements.filter((agreement) => {
      const matchesStatus =
        activeFilter === 'ALL' || agreement.status === activeFilter
      const matchesSearch =
        !query ||
        `${agreement.clientName} ${agreement.coupleNames}`
          .toLowerCase()
          .includes(query)

      return matchesStatus && matchesSearch
    })
  }, [activeFilter, agreements, search])

  useEffect(() => {
    if (!signedSuccess) return undefined

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (!reducedMotion) {
      confetti({
        particleCount: 48,
        spread: 54,
        startVelocity: 25,
        gravity: 0.9,
        scalar: 0.82,
        ticks: 150,
        origin: { x: 0.5, y: 0.62 },
        colors: ['#722F37', '#D4AF37', '#F3E5AB', '#FFFDF9'],
        disableForReducedMotion: true,
      })
    }

    return undefined
  }, [signedSuccess])

  function handleSign({ signatureData, signatureDate }) {
    const agreement = signingAgreement
    if (!agreement) return

    const signedAgreement = {
      ...agreement,
      status: 'SIGNED',
      signatureDate,
      signatureData,
    }

    setAgreements((currentAgreements) =>
      currentAgreements.map((item) =>
        item.id === agreement.id ? signedAgreement : item,
      ),
    )
    setSigningAgreement(null)
    setSignedSuccess(signedAgreement)
    showToast({
      type: 'success',
      message: `${agreement.agreementId} has been signed.`,
    })
  }

  return (
    <>
      <div className="mx-auto max-w-[1500px] space-y-7">
        <AnimatedCard className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-royalMaroon">
              The Royal Knot · Client relations
            </p>
            <h1 className="font-serif text-3xl font-semibold text-royalMaroonDark sm:text-4xl">
              Digital Agreements
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slateNavy/70 sm:text-base">
              Formalize every celebration with clarity, confidence and elegance.
            </p>
          </div>
        </AnimatedCard>

        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Agreement statistics"
        >
          {statisticDetails.map(({ key, label, icon: Icon, accent }, index) => (
            <AnimatedCard key={key} delay={index * 0.04}>
              <div className="flex items-center justify-between rounded-xl border border-champagneGold/25 bg-white px-4 py-4 shadow-sm sm:px-5">
                <div>
                  <p className="text-xs font-medium text-slateNavy/65">{label}</p>
                  <p className="mt-1 font-serif text-2xl font-semibold text-royalMaroonDark">
                    {statistics[key]}
                  </p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-creamIvory ${accent}`}>
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>
            </AnimatedCard>
          ))}
        </section>

        <AnimatedCard delay={0.12}>
          <section className="overflow-hidden rounded-xl border border-champagneGold/25 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-champagneGold/20 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-serif text-xl font-semibold text-royalMaroonDark">
                    Agreement register
                  </h2>
                  <p className="mt-1 text-xs text-slateNavy/60">
                    {visibleAgreements.length} of {agreements.length} agreements
                  </p>
                </div>
                <label className="relative block w-full lg:max-w-sm">
                  <span className="sr-only">
                    Search by client or couple name
                  </span>
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slateNavy/45"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search client or couple name"
                    className="min-h-11 w-full rounded-md border border-slate-200 bg-creamIvory/70 pl-10 pr-3 text-sm outline-none transition placeholder:text-slateNavy/45 focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15"
                  />
                </label>
              </div>

              <div
                className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
                role="tablist"
                aria-label="Filter agreements by status"
              >
                {statusFilters.map((status) => {
                  const selected = activeFilter === status
                  const count =
                    status === 'ALL'
                      ? statistics.total
                      : statistics[status.toLowerCase()]

                  return (
                    <button
                      key={status}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveFilter(status)}
                      className={`min-h-9 shrink-0 rounded-full border px-4 text-[11px] font-semibold tracking-[0.06em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon ${
                        selected
                          ? 'border-royalMaroon bg-royalMaroon text-white'
                          : 'border-slate-200 bg-white text-slateNavy/70 hover:border-champagneGold hover:text-royalMaroon'
                      }`}
                    >
                      {status === 'ALL' ? 'All' : status}
                      <span className="ml-1.5 opacity-75">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <AnimatePresence mode="popLayout">
                <AgreementList
                  key={`${activeFilter}-${search}`}
                  agreements={visibleAgreements}
                  onView={setPreviewAgreement}
                  onSign={setSigningAgreement}
                />
              </AnimatePresence>
            </div>
          </section>
        </AnimatedCard>
      </div>

      <AnimatePresence>
        {previewAgreement && (
          <AgreementPreview
            agreement={
              agreements.find((item) => item.id === previewAgreement.id) ??
              previewAgreement
            }
            onClose={() => setPreviewAgreement(null)}
          />
        )}
      </AnimatePresence>

      {signingAgreement && (
        <DigitalSignatureModal
          key={signingAgreement.id}
          agreement={signingAgreement}
          onClose={() => setSigningAgreement(null)}
          onSign={handleSign}
        />
      )}

      <SigningSuccess
        agreement={signedSuccess}
        onClose={() => setSignedSuccess(null)}
      />
    </>
  )
}

export default Agreements
