import { useMemo, useState } from 'react'
import { ArrowDownUp, Search } from 'lucide-react'
import { formatCurrency } from '../../utils/currency.js'

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(value) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`))
}

function PaymentHistory({ payments, weddings }) {
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [dateOrder, setDateOrder] = useState('NEWEST')

  const visiblePayments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return payments
      .filter((payment) => {
        const wedding = weddings.find((item) => item.id === payment.weddingId)
        const milestone = payment.milestoneId.replace(/^\w/, (letter) => letter.toUpperCase())
        const matchesMethod = methodFilter === 'ALL' || payment.method === methodFilter
        const searchable = [
          payment.paymentId,
          payment.referenceId,
          payment.method,
          payment.status,
          wedding?.weddingName,
          wedding?.clientName,
          milestone,
        ].join(' ').toLowerCase()

        return matchesMethod && (!query || searchable.includes(query))
      })
      .sort((left, right) =>
        dateOrder === 'NEWEST'
          ? right.paymentDate.localeCompare(left.paymentDate)
          : left.paymentDate.localeCompare(right.paymentDate),
      )
  }, [dateOrder, methodFilter, payments, search, weddings])

  return (
    <section aria-labelledby="payment-history-heading" className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-royalMaroon">
            Recorded transactions
          </p>
          <h2
            id="payment-history-heading"
            className="mt-1 font-serif text-2xl font-semibold text-royalMaroonDark"
          >
            Payment history
          </h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(210px,1fr)_170px_155px]">
          <label className="relative">
            <span className="sr-only">Search payment history</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slateNavy/45"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transactions"
              aria-label="Search payment history"
              className="min-h-10 w-full rounded-md border border-champagneGold/45 bg-white pl-9 pr-3 text-xs outline-none focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15"
            />
          </label>
          <label>
            <span className="sr-only">Filter payment method</span>
            <select
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
              aria-label="Filter payment method"
              className="min-h-10 w-full rounded-md border border-champagneGold/45 bg-white px-3 text-xs outline-none focus:border-royalMaroon focus:ring-2 focus:ring-royalMaroon/15"
            >
              <option value="ALL">All methods</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setDateOrder((current) => current === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-champagneGold/45 bg-white px-3 text-xs font-medium text-slateNavy transition hover:bg-creamIvory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royalMaroon"
            aria-label={`Date order: ${dateOrder.toLowerCase()}. Toggle date order`}
          >
            <ArrowDownUp size={14} aria-hidden="true" />
            {dateOrder === 'NEWEST' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>
      </div>

      {visiblePayments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-champagneGold/55 bg-white px-5 py-10 text-center">
          <p className="font-serif text-lg font-semibold text-royalMaroonDark">No payments found</p>
          <p className="mt-1 text-sm text-slateNavy/65">
            Try a different search or payment method.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-champagneGold/30 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead className="bg-creamIvory text-[10px] font-semibold uppercase tracking-[0.1em] text-slateNavy/60">
                  <tr>
                    <th scope="col" className="px-4 py-3">Transaction</th>
                    <th scope="col" className="px-4 py-3">Wedding / Client</th>
                    <th scope="col" className="px-4 py-3">Milestone</th>
                    <th scope="col" className="px-4 py-3">Payment date</th>
                    <th scope="col" className="px-4 py-3">Amount</th>
                    <th scope="col" className="px-4 py-3">Method</th>
                    <th scope="col" className="px-4 py-3">Reference</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {visiblePayments.map((payment) => {
                    const wedding = weddings.find((item) => item.id === payment.weddingId)

                    return (
                      <tr key={payment.paymentId} className="transition hover:bg-creamIvory/70">
                        <td className="px-4 py-3 font-semibold text-royalMaroonDark">{payment.paymentId}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slateNavy">{wedding?.weddingName ?? 'Wedding'}</p>
                          <p className="mt-0.5 text-[10px] text-slateNavy/55">{wedding?.clientName}</p>
                        </td>
                        <td className="px-4 py-3">{payment.milestoneId === 'booking' ? 'Booking Advance' : payment.milestoneId === 'planning' ? 'Planning Milestone' : 'Final Payment'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatDate(payment.paymentDate)}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-royalMaroon">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3">{payment.method}</td>
                        <td className="px-4 py-3 text-slateNavy/70">{payment.referenceId || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-emeraldSuccess/35 bg-emeraldSuccess/10 px-2.5 py-1 text-[9px] font-semibold tracking-wide text-emerald-800">
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-3 md:hidden">
            {visiblePayments.map((payment) => {
              const wedding = weddings.find((item) => item.id === payment.weddingId)
              const milestoneName = payment.milestoneId === 'booking' ? 'Booking Advance' : payment.milestoneId === 'planning' ? 'Planning Milestone' : 'Final Payment'

              return (
                <li key={payment.paymentId} className="rounded-xl border border-champagneGold/30 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all text-[10px] font-semibold text-royalMaroon">{payment.paymentId}</p>
                      <p className="mt-1 truncate font-serif font-semibold text-royalMaroonDark">{wedding?.weddingName}</p>
                      <p className="text-xs text-slateNavy/60">{wedding?.clientName}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-royalMaroon">{formatCurrency(payment.amount)}</p>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-[10px]">
                    <div><dt className="text-slateNavy/55">Milestone</dt><dd className="mt-0.5 font-medium">{milestoneName}</dd></div>
                    <div><dt className="text-slateNavy/55">Date</dt><dd className="mt-0.5 font-medium">{formatDate(payment.paymentDate)}</dd></div>
                    <div><dt className="text-slateNavy/55">Method</dt><dd className="mt-0.5 font-medium">{payment.method}</dd></div>
                    <div><dt className="text-slateNavy/55">Reference</dt><dd className="mt-0.5 break-all font-medium">{payment.referenceId || '—'}</dd></div>
                  </dl>
                  <span className="mt-3 inline-flex rounded-full border border-emeraldSuccess/35 bg-emeraldSuccess/10 px-2.5 py-1 text-[9px] font-semibold tracking-wide text-emerald-800">
                    {payment.status}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

export default PaymentHistory
