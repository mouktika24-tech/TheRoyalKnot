import { motion } from 'framer-motion';
import { CheckCircle2, Clock3, MapPin, Store, TriangleAlert } from 'lucide-react';

const sampleVendors = [
  { id: 1, name: 'Rajputana Floral Studio', category: 'Florist', scheduled: '14:00', actual: '13:52', status: 'ARRIVED', location: 'Garden Pavilion' },
  { id: 2, name: 'Jaipur Sound & Lights', category: 'DJ & Sound', scheduled: '15:30', actual: null, status: 'DELAYED', location: 'Grand Ballroom' },
  { id: 3, name: 'Mewar Royal Catering', category: 'Caterer', scheduled: '16:00', actual: null, status: 'PENDING', location: 'Banquet Hall' },
];

const statusStyles = {
  ARRIVED: 'border-emeraldSuccess/30 bg-emeraldSuccess/5 text-emeraldSuccess',
  DELAYED: 'border-rubyDanger/40 bg-rubyDanger/5 text-rubyDanger',
  PENDING: 'border-champagneGold/30 bg-white text-slateNavy/65',
};

function VendorCheckinBoard({ vendors = sampleVendors, loading = false, error = null }) {
  return (
    <section aria-labelledby="vendor-checkin-title" className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="rounded-xl bg-champagneGoldLight p-3 text-royalMaroon" aria-hidden="true">
          <Store size={22} />
        </span>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-royalMaroon">Wedding day operations</p>
          <h2 id="vendor-checkin-title" className="text-2xl font-semibold text-slateNavy">Vendor Check-ins</h2>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-rubyDanger/30 bg-rubyDanger/10 px-4 py-3 text-sm text-rubyDanger">
          {error}
        </p>
      )}

      {loading ? (
        <p role="status" className="rounded-2xl border border-champagneGold/30 bg-creamIvory px-4 py-10 text-center text-sm text-slateNavy/60">
          Loading vendor check-ins…
        </p>
      ) : vendors.length === 0 ? (
        <p className="rounded-2xl border border-champagneGold/30 bg-creamIvory px-4 py-10 text-center text-sm text-slateNavy/60">
          No vendors are scheduled to check in.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vendors.map((vendor, index) => {
            const isDelayed = vendor.status === 'DELAYED';
            const StatusIcon = vendor.status === 'ARRIVED' ? CheckCircle2 : isDelayed ? TriangleAlert : Clock3;

            return (
              <motion.li
                key={vendor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <article className={`h-full rounded-2xl border bg-creamIvory p-5 shadow-sm ${isDelayed ? 'animate-pulse border-rubyDanger/50' : 'border-champagneGold/30'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-royalMaroon">{vendor.category}</p>
                      <h3 className="mt-1 text-lg font-semibold text-slateNavy">{vendor.name}</h3>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[vendor.status] || statusStyles.PENDING}`}>
                      <StatusIcon size={14} aria-hidden="true" />
                      {vendor.status === 'ARRIVED' ? 'Arrived' : vendor.status === 'DELAYED' ? 'Delayed' : 'Expected'}
                    </span>
                  </div>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slateNavy/60">Scheduled</dt>
                      <dd className="font-medium text-slateNavy">{vendor.scheduled}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slateNavy/60">Actual arrival</dt>
                      <dd className="font-medium text-slateNavy">{vendor.actual || 'Not checked in'}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 flex items-center gap-1.5 border-t border-champagneGold/20 pt-4 text-sm text-slateNavy/65">
                    <MapPin size={14} aria-hidden="true" />
                    {vendor.location}
                  </p>
                </article>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default VendorCheckinBoard;
