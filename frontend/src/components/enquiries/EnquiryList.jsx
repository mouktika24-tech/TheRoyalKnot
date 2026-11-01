import { motion } from 'framer-motion'
import {
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Phone,
  UsersRound,
} from 'lucide-react'

const statusStyles = {
  ENQUIRY: 'border-champagneGold/70 bg-champagneGoldLight/45 text-royalMaroonDark',
  PROPOSED: 'border-slateNavy/20 bg-slateLight text-slateNavy',
  CONFIRMED: 'border-emeraldSuccess/30 bg-emeraldSuccess/10 text-emerald-800',
}

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(value) {
  if (!value) return 'Dates to be confirmed'
  return dateFormatter.format(new Date(`${value}T00:00:00Z`))
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return 'Dates to be confirmed'
  if (!endDate) return formatDate(startDate)
  if (!startDate) return formatDate(endDate)
  return `${formatDate(startDate)} – ${formatDate(endDate)}`
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] ${statusStyles[status]}`}
    >
      {status}
    </span>
  )
}

function ConsultationSummary({ consultation }) {
  if (!consultation) {
    return <span className="text-sm text-slateNavy/55">Not scheduled</span>
  }

  return (
    <span className="flex flex-col gap-1 text-xs text-slateNavy">
      <span className="flex items-center gap-1.5 font-medium">
        <CalendarDays size={13} className="text-royalMaroon" aria-hidden="true" />
        {formatDate(consultation.date)}
      </span>
      <span className="flex items-center gap-1.5 text-slateNavy/65">
        <Clock3 size={13} aria-hidden="true" />
        {consultation.time} · {consultation.meetingType}
      </span>
    </span>
  )
}

function EnquiryList({ enquiries, onScheduleConsultation }) {
  if (enquiries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-champagneGold/60 bg-white px-5 py-12 text-center">
        <p className="font-serif text-xl font-semibold text-royalMaroonDark">
          No enquiries found
        </p>
        <p className="mt-2 text-sm text-slateNavy/65">
          Try another search or status filter to find a celebration.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 xl:hidden">
        {enquiries.map((enquiry, index) => (
          <motion.article
            key={enquiry.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, delay: index * 0.025 }}
            className="rounded-xl border border-champagneGold/25 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg font-semibold text-royalMaroonDark">
                  {enquiry.clientName}
                </h2>
                <p className="mt-0.5 text-sm text-slateNavy/70">
                  {enquiry.coupleName}
                </p>
              </div>
              <StatusBadge status={enquiry.status} />
            </div>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <a
                href={`mailto:${enquiry.email}`}
                className="flex min-w-0 items-center gap-2 text-slateNavy/80 hover:text-royalMaroon"
              >
                <Mail size={15} className="shrink-0 text-royalMaroon" aria-hidden="true" />
                <span className="break-all">{enquiry.email}</span>
              </a>
              <a
                href={`tel:${enquiry.phone}`}
                className="flex items-center gap-2 text-slateNavy/80 hover:text-royalMaroon"
              >
                <Phone size={15} className="shrink-0 text-royalMaroon" aria-hidden="true" />
                {enquiry.phone}
              </a>
            </div>

            <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-royalMaroon">
                  <MapPin size={13} aria-hidden="true" />
                  {enquiry.city}
                </p>
                <p className="mt-1 text-sm font-medium text-slateNavy">
                  {enquiry.venue}
                </p>
                <p className="mt-1 text-xs text-slateNavy/65">
                  {formatDateRange(enquiry.startDate, enquiry.endDate)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="flex items-center gap-1 text-xs text-slateNavy/60">
                    <UsersRound size={13} aria-hidden="true" /> Guests
                  </p>
                  <p className="mt-1 font-medium">{enquiry.guests}</p>
                </div>
                <div>
                  <p className="text-xs text-slateNavy/60">Estimated budget</p>
                  <p className="mt-1 font-medium">
                    {moneyFormatter.format(enquiry.budget)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slateNavy/60">Package</p>
                  <p className="mt-1 font-medium">{enquiry.packageType}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slateNavy/55">
                  Consultation
                </p>
                <ConsultationSummary consultation={enquiry.consultation} />
              </div>
              <button
                type="button"
                onClick={() => onScheduleConsultation(enquiry)}
                className="min-h-10 rounded-md border border-royalMaroon/30 px-3 text-xs font-semibold text-royalMaroon transition hover:bg-royalMaroon hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
              >
                {enquiry.consultation ? 'Edit consultation' : 'Schedule consultation'}
              </button>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-champagneGold/25 bg-white shadow-sm xl:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] table-auto text-left">
            <thead className="bg-slateLight text-[10px] uppercase tracking-[0.12em] text-slateNavy/65">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Client &amp; couple</th>
                <th scope="col" className="px-4 py-3 font-semibold">Contact</th>
                <th scope="col" className="px-4 py-3 font-semibold">Wedding</th>
                <th scope="col" className="px-4 py-3 font-semibold">Event details</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Consultation</th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.map((enquiry, index) => (
                <motion.tr
                  key={enquiry.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, delay: index * 0.02 }}
                  className="align-top transition hover:bg-creamIvory/70"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-royalMaroonDark">
                      {enquiry.clientName}
                    </p>
                    <p className="mt-1 text-sm text-slateNavy/70">
                      {enquiry.coupleName}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={`mailto:${enquiry.email}`}
                      className="block max-w-48 break-all text-xs text-slateNavy hover:text-royalMaroon"
                    >
                      {enquiry.email}
                    </a>
                    <a
                      href={`tel:${enquiry.phone}`}
                      className="mt-1 block text-xs text-slateNavy/65 hover:text-royalMaroon"
                    >
                      {enquiry.phone}
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <MapPin size={14} className="text-royalMaroon" aria-hidden="true" />
                      {enquiry.city}
                    </p>
                    <p className="mt-1 text-xs text-slateNavy/70">{enquiry.venue}</p>
                    <p className="mt-1 text-xs text-slateNavy/55">
                      {formatDateRange(enquiry.startDate, enquiry.endDate)}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="flex items-center gap-1.5 text-sm">
                      <UsersRound size={14} className="text-royalMaroon" aria-hidden="true" />
                      {enquiry.guests} guests
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {moneyFormatter.format(enquiry.budget)}
                    </p>
                    <p className="mt-1 text-xs text-slateNavy/60">
                      {enquiry.packageType}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={enquiry.status} />
                  </td>
                  <td className="px-4 py-4">
                    <ConsultationSummary consultation={enquiry.consultation} />
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => onScheduleConsultation(enquiry)}
                      className="whitespace-nowrap rounded-md border border-royalMaroon/30 px-3 py-2 text-xs font-semibold text-royalMaroon transition hover:bg-royalMaroon hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
                    >
                      {enquiry.consultation ? 'Edit consultation' : 'Schedule'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default EnquiryList
