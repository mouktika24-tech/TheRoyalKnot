import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Plus,
  Search,
  UsersRound,
} from 'lucide-react'
import AnimatedCard from '../components/common/AnimatedCard.jsx'
import ConsultationModal from '../components/enquiries/ConsultationModal.jsx'
import EnquiryList from '../components/enquiries/EnquiryList.jsx'
import NewEnquiryModal from '../components/enquiries/NewEnquiryModal.jsx'
import { initialEnquiries } from '../data/mockEnquiries.js'
import { useToast } from '../context/useToast.js'

const statusFilters = ['ALL', 'ENQUIRY', 'PROPOSED', 'CONFIRMED']

const statisticDetails = [
  {
    key: 'total',
    label: 'Total enquiries',
    icon: UsersRound,
    accent: 'text-royalMaroon',
  },
  {
    key: 'new',
    label: 'New enquiries',
    icon: CircleDot,
    accent: 'text-champagneGold',
  },
  {
    key: 'proposed',
    label: 'Proposed',
    icon: CalendarDays,
    accent: 'text-slateNavy',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    icon: CheckCircle2,
    accent: 'text-emeraldSuccess',
  },
]

function Enquiries() {
  const [enquiries, setEnquiries] = useState(initialEnquiries)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [isNewEnquiryOpen, setIsNewEnquiryOpen] = useState(false)
  const [consultationEnquiry, setConsultationEnquiry] = useState(null)
  const { showToast } = useToast()

  const statistics = useMemo(
    () => ({
      total: enquiries.length,
      new: enquiries.filter((enquiry) => enquiry.status === 'ENQUIRY').length,
      proposed: enquiries.filter((enquiry) => enquiry.status === 'PROPOSED').length,
      confirmed: enquiries.filter((enquiry) => enquiry.status === 'CONFIRMED').length,
    }),
    [enquiries],
  )

  const visibleEnquiries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return enquiries.filter((enquiry) => {
      const matchesStatus =
        activeFilter === 'ALL' || enquiry.status === activeFilter
      const matchesSearch =
        !normalizedSearch ||
        [
          enquiry.clientName,
          enquiry.coupleName,
          enquiry.email,
          enquiry.phone,
          enquiry.city,
          enquiry.venue,
          enquiry.packageType,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [activeFilter, enquiries, search])

  function handleCreateEnquiry(details) {
    const newEnquiry = {
      ...details,
      id: crypto.randomUUID(),
      status: 'ENQUIRY',
      consultation: null,
    }

    setEnquiries((currentEnquiries) => [newEnquiry, ...currentEnquiries])
    setIsNewEnquiryOpen(false)
    setActiveFilter('ALL')
    setSearch('')
    showToast({
      type: 'success',
      message: `Enquiry for ${newEnquiry.coupleName} has been added.`,
    })
  }

  function handleSaveConsultation(details) {
    const coupleName = consultationEnquiry.coupleName

    setEnquiries((currentEnquiries) =>
      currentEnquiries.map((enquiry) =>
        enquiry.id === consultationEnquiry.id
          ? { ...enquiry, consultation: details, status: 'PROPOSED' }
          : enquiry,
      ),
    )
    setConsultationEnquiry(null)
    showToast({
      type: 'success',
      message: `Consultation for ${coupleName} has been scheduled.`,
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
              Wedding Enquiries
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slateNavy/70 sm:text-base">
              Manage incoming enquiries and turn celebrations into unforgettable
              experiences.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsNewEnquiryOpen(true)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-royalMaroon px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-royalMaroonDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon focus-visible:ring-offset-2"
          >
            <Plus size={18} aria-hidden="true" />
            New Enquiry
          </button>
        </AnimatedCard>

        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Enquiry statistics"
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
                    Enquiry register
                  </h2>
                  <p className="mt-1 text-xs text-slateNavy/60">
                    {visibleEnquiries.length} of {enquiries.length} celebrations
                  </p>
                </div>
                <label className="relative block w-full lg:max-w-sm">
                  <span className="sr-only">Search enquiries</span>
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slateNavy/45"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, venue, city or contact"
                    className="min-h-11 w-full rounded-md border border-slate-200 bg-creamIvory/70 pl-10 pr-3 text-sm outline-none transition placeholder:text-slateNavy/45 focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15"
                  />
                </label>
              </div>

              <div
                className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
                role="tablist"
                aria-label="Filter enquiries by status"
              >
                {statusFilters.map((status) => {
                  const selected = activeFilter === status
                  const label = status === 'ALL' ? 'All' : status

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
                      {label}
                      {status !== 'ALL' && (
                        <span className="ml-1.5 opacity-75">
                          {statistics[status.toLowerCase() === 'enquiry' ? 'new' : status.toLowerCase()]}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <AnimatePresence mode="popLayout">
                <EnquiryList
                  key={`${activeFilter}-${search}`}
                  enquiries={visibleEnquiries}
                  onScheduleConsultation={setConsultationEnquiry}
                />
              </AnimatePresence>
            </div>
          </section>
        </AnimatedCard>
      </div>

      <NewEnquiryModal
        isOpen={isNewEnquiryOpen}
        onClose={() => setIsNewEnquiryOpen(false)}
        onSubmit={handleCreateEnquiry}
      />
      {consultationEnquiry && (
        <ConsultationModal
          key={consultationEnquiry.id}
          isOpen
          enquiry={consultationEnquiry}
          onClose={() => setConsultationEnquiry(null)}
          onSubmit={handleSaveConsultation}
        />
      )}
    </>
  )
}

export default Enquiries
