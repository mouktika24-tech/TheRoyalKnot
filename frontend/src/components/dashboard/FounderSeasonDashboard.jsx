import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  Filter,
  IndianRupee,
  MapPin,
  TrendingUp,
  Users,
} from 'lucide-react';

const SEASON_WEDDINGS = [
  {
    wedding_id: 1,
    couple_name: 'Ananya & Kabir',
    venue_name: 'Rambagh Palace',
    city: 'JAIPUR',
    event_date: '2026-11-14',
    guest_count: 400,
    base_quote: '4200000.00',
    extra_billed: '162000.00',
    margin_percent: 24.5,
    status: 'LIVE_BIG_DAY',
  },
  {
    wedding_id: 2,
    couple_name: 'Rhea & Siddharth',
    venue_name: 'City Palace',
    city: 'UDAIPUR',
    event_date: '2026-11-28',
    guest_count: 350,
    base_quote: '5100000.00',
    extra_billed: '0.00',
    margin_percent: 21,
    status: 'PLANNING',
  },
  {
    wedding_id: 3,
    couple_name: 'Meera & Dev',
    venue_name: 'Fairmont Jaipur',
    city: 'JAIPUR',
    event_date: '2026-12-05',
    guest_count: 550,
    base_quote: '6800000.00',
    extra_billed: '240000.00',
    margin_percent: 26.2,
    status: 'PLANNING',
  },
  {
    wedding_id: 4,
    couple_name: 'Tara & Aditya',
    venue_name: 'Taj Lake Palace',
    city: 'UDAIPUR',
    event_date: '2026-12-18',
    guest_count: 220,
    base_quote: '7400000.00',
    extra_billed: '0.00',
    margin_percent: 28,
    status: 'PLANNING',
  },
  {
    wedding_id: 5,
    couple_name: 'Pooja & Rohan',
    venue_name: 'Rambagh Palace',
    city: 'JAIPUR',
    event_date: '2027-01-09',
    guest_count: 450,
    base_quote: '4600000.00',
    extra_billed: '185000.00',
    margin_percent: 22.8,
    status: 'RECONCILED',
  },
  {
    wedding_id: 6,
    couple_name: 'Simran & Karan',
    venue_name: 'City Palace',
    city: 'UDAIPUR',
    event_date: '2027-01-22',
    guest_count: 300,
    base_quote: '5900000.00',
    extra_billed: '92000.00',
    margin_percent: 23.5,
    status: 'RECONCILED',
  },
  {
    wedding_id: 7,
    couple_name: 'Ishita & Arjun',
    venue_name: 'Fairmont Jaipur',
    city: 'JAIPUR',
    event_date: '2027-02-06',
    guest_count: 500,
    base_quote: '5700000.00',
    extra_billed: '1300000.00',
    margin_percent: 16,
    status: 'PLANNING',
  },
  {
    wedding_id: 8,
    couple_name: 'Naina & Veer',
    venue_name: 'Rambagh Palace',
    city: 'JAIPUR',
    event_date: '2027-02-20',
    guest_count: 380,
    base_quote: '5500000.00',
    extra_billed: '1341000.00',
    margin_percent: 17.2,
    status: 'PLANNING',
  },
];

const LOCATIONS = ['ALL', 'JAIPUR', 'UDAIPUR'];
const STATUSES = ['ALL', 'PLANNING', 'COMPLETED'];

function toCents(value) {
  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!match) return null;
    return BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
  }

  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    const cents = Math.round(value * 100);
    return Number.isSafeInteger(cents) ? BigInt(cents) : null;
  }

  return null;
}

function formatINR(cents) {
  const rupees = cents / 100n;
  const paise = String(cents % 100n).padStart(2, '0');
  return `₹${new Intl.NumberFormat('en-IN').format(rupees)}.${paise}`;
}

function formatScaledAmount(cents, divisor, suffix) {
  const hundredths = (cents + divisor / 2n) / divisor;
  return `₹${hundredths / 100n}.${String(hundredths % 100n).padStart(2, '0')} ${suffix}`;
}

function normalizeStatus(value) {
  const status = typeof value === 'string' ? value.trim().toUpperCase().replace(/[\s-]+/g, '_') : '';
  if (status === 'COMPLETED') return 'RECONCILED';
  return ['PLANNING', 'LIVE_BIG_DAY', 'RECONCILED'].includes(status) ? status : null;
}

function normalizeWedding(wedding, index) {
  if (!wedding || typeof wedding !== 'object') return { error: `Wedding record ${index + 1} is invalid.` };

  const baseCents = toCents(wedding.base_quote ?? wedding.baseQuote ?? wedding.contracted_value);
  const extrasCents = toCents(wedding.extra_billed ?? wedding.extraBilled ?? wedding.incidentals_billed ?? '0.00');
  const guestCount = Number(wedding.guest_count ?? wedding.guestCount);
  const city = typeof wedding.city === 'string' ? wedding.city.trim().toUpperCase() : '';
  const status = normalizeStatus(wedding.status ?? wedding.operational_status);
  const couple = wedding.couple_name ?? wedding.client_name ?? wedding.couple;
  const venue = wedding.venue_name ?? wedding.venue;
  const date = wedding.event_date ?? wedding.wedding_date;
  const margin = Number(wedding.margin_percent ?? wedding.marginPercent);

  if (
    baseCents === null
    || extrasCents === null
    || !Number.isSafeInteger(guestCount)
    || guestCount < 0
    || !['JAIPUR', 'UDAIPUR'].includes(city)
    || !status
    || typeof couple !== 'string'
    || !couple.trim()
    || typeof venue !== 'string'
    || !venue.trim()
    || typeof date !== 'string'
    || !Number.isFinite(margin)
    || margin < 0
  ) {
    return { error: `Wedding record ${index + 1} has missing or invalid portfolio data.` };
  }

  return {
    id: wedding.wedding_id ?? wedding.id ?? index + 1,
    couple: couple.trim(),
    venue: venue.trim(),
    city,
    date,
    guests: guestCount,
    baseCents,
    extrasCents,
    margin,
    status,
  };
}

function csvCell(value) {
  const text = String(value ?? '');
  const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function formatWeddingDate(value) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function FounderSeasonDashboard({
  weddings = SEASON_WEDDINGS,
  seasonNetMarginPercent = 22.4,
  loading = false,
  error = null,
}) {
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [exportMessage, setExportMessage] = useState('');
  const [exportError, setExportError] = useState('');

  const { records, validationErrors } = useMemo(() => {
    if (!Array.isArray(weddings)) {
      return { records: [], validationErrors: ['Season wedding data must be an array.'] };
    }

    const normalized = weddings.map(normalizeWedding);
    return {
      records: normalized.filter((record) => !record.error),
      validationErrors: normalized.filter((record) => record.error).map((record) => record.error),
    };
  }, [weddings]);

  const totals = useMemo(() => records.reduce((result, wedding) => ({
    base: result.base + wedding.baseCents,
    extras: result.extras + wedding.extrasCents,
    guests: result.guests + wedding.guests,
  }), { base: 0n, extras: 0n, guests: 0 }), [records]);

  const filteredWeddings = records.filter((wedding) => (
    (selectedCity === 'ALL' || wedding.city === selectedCity)
    && (selectedStatus === 'ALL'
      || (selectedStatus === 'PLANNING' && wedding.status === 'PLANNING')
      || (selectedStatus === 'COMPLETED' && wedding.status === 'RECONCILED'))
  ));
  const jaipurCount = records.filter((wedding) => wedding.city === 'JAIPUR').length;
  const udaipurCount = records.filter((wedding) => wedding.city === 'UDAIPUR').length;
  const margin = Number(seasonNetMarginPercent);
  const marginLabel = Number.isFinite(margin) && margin >= 0 ? `${margin.toFixed(1)}%` : '—';
  const gross = totals.base + totals.extras;

  const exportCSV = () => {
    setExportMessage('');
    setExportError('');

    try {
      const headers = [
        'Wedding ID', 'Client Names', 'Venue', 'City', 'Wedding Date', 'Guest Count',
        'Contracted Value (INR)', 'Incidentals Billed (INR)', 'Net Margin (%)', 'Operational Status',
      ];
      const rows = filteredWeddings.map((wedding) => [
        wedding.id,
        wedding.couple,
        wedding.venue,
        wedding.city,
        wedding.date,
        wedding.guests,
        formatINR(wedding.baseCents),
        formatINR(wedding.extrasCents),
        wedding.margin.toFixed(1),
        wedding.status,
      ]);
      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RoyalKnot_Season_Audit_${selectedCity}_${selectedStatus}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setExportMessage(`Season audit exported for ${filteredWeddings.length} wedding${filteredWeddings.length === 1 ? '' : 's'}.`);
    } catch (exportFailure) {
      console.error('Season audit export failed.', exportFailure);
      setExportError('The season audit could not be exported. Please try again.');
    }
  };

  const displayedError = typeof error === 'string' ? error : error?.message;

  return (
    <section aria-labelledby="founder-season-title" className="min-h-screen space-y-6 bg-white p-4 text-slate-900 sm:p-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-champagneGold">Scene 6 Executive Terminal</p>
            <span className="rounded-full border border-royalMaroon/30 bg-royalMaroon/10 px-2.5 py-1 text-xs font-medium text-royalMaroon">
              Winter Season 2026–27
            </span>
          </div>
          <h1 id="founder-season-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Founder Season Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Financial performance and palace operations across Jaipur and Udaipur.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          disabled={loading || filteredWeddings.length === 0}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg bg-royalMaroon px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-royalMaroonDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagneGold disabled:cursor-not-allowed disabled:opacity-50 md:self-auto"
        >
          <Download size={16} aria-hidden="true" />
          Export Season Audit CSV
        </button>
      </header>

      {displayedError && (
        <p role="alert" className="rounded-xl border border-rubyDanger/30 bg-rubyDanger/10 px-4 py-3 text-sm text-rubyDanger">
          {displayedError}
        </p>
      )}
      {validationErrors.length > 0 && (
        <div role="alert" className="rounded-xl border border-rubyDanger/30 bg-rubyDanger/10 px-4 py-3 text-sm text-rubyDanger">
          <p className="font-semibold">Some season records could not be included:</p>
          <ul className="mt-1 list-inside list-disc">
            {validationErrors.map((validationError) => <li key={validationError}>{validationError}</li>)}
          </ul>
        </div>
      )}
      {exportMessage && <p role="status" className="text-sm text-emeraldSuccess">{exportMessage}</p>}
      {exportError && <p role="alert" className="text-sm text-rubyDanger">{exportError}</p>}

      {loading ? (
        <div role="status" className="rounded-2xl border border-champagneGold/30 bg-creamIvory px-4 py-12 text-center text-sm text-slateNavy/70">
          Loading season performance…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <motion.article
              className="rounded-2xl border border-champagneGold/30 bg-creamIvory p-5 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-1 flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase">Total Season Gross</span>
                <IndianRupee size={18} className="text-royalMaroon" aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatScaledAmount(gross, 10_000_000n, 'Cr')}</p>
              <p className="mt-2 text-xs text-slate-500">{formatINR(gross)} across {records.length} destination weddings</p>
            </motion.article>

            <motion.article
              className="rounded-2xl border border-champagneGold/30 bg-creamIvory p-5 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.04 }}
            >
              <div className="mb-1 flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase">Season Net Margin</span>
                <TrendingUp size={18} className="text-champagneGold" aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{marginLabel}</p>
              <p className="mt-2 text-xs text-slate-500">Target: 22.4% net agency commission &amp; markup</p>
            </motion.article>

            <motion.article
              className="rounded-2xl border border-champagneGold/30 bg-creamIvory p-5 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.08 }}
            >
              <div className="mb-1 flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase">Contracted &amp; Incidentals</span>
                <ArrowUpRight size={18} className="text-royalMaroon" aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatScaledAmount(totals.base, 10_000_000n, 'Cr')}</p>
              <p className="mt-2 text-xs text-slate-500">
                Base contracted <span className="font-semibold text-slateNavy">{formatINR(totals.base)}</span>
                <span aria-hidden="true"> · </span>
                Incidentals billed <span className="font-semibold text-slateNavy">{formatScaledAmount(totals.extras, 100_000n, 'L')}</span>
              </p>
            </motion.article>

            <motion.article
              className="rounded-2xl border border-champagneGold/30 bg-creamIvory p-5 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.12 }}
            >
              <div className="mb-1 flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase">Confirmed Palace Pipeline</span>
                <Building2 size={18} className="text-royalMaroon" aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{records.length} Weddings</p>
              <p className="mt-2 text-xs text-slate-500">{jaipurCount} Jaipur <span aria-hidden="true">·</span> {udaipurCount} Udaipur</p>
            </motion.article>
          </div>

          <section aria-label="Portfolio filters" className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <MapPin size={16} className="text-royalMaroon" aria-hidden="true" />
              <span className="mr-1 text-sm font-semibold text-slate-700">Location</span>
              {LOCATIONS.map((city) => (
                <button
                  key={city}
                  type="button"
                  aria-pressed={selectedCity === city}
                  onClick={() => setSelectedCity(city)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagneGold ${
                    selectedCity === city
                      ? 'border-royalMaroon bg-royalMaroon text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter size={16} className="text-royalMaroon" aria-hidden="true" />
              <span className="mr-1 text-sm font-semibold text-slate-700">Status</span>
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={selectedStatus === status}
                  onClick={() => setSelectedStatus(status)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagneGold ${
                    selectedStatus === status
                      ? 'border-royalMaroon bg-royalMaroon text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="season-portfolio-title" className="overflow-hidden rounded-2xl border border-champagneGold/30 bg-creamIvory shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-champagneGold/30 px-5 py-4 sm:px-6">
              <div>
                <h2 id="season-portfolio-title" className="font-semibold text-slateNavy">Palace &amp; Venue Portfolio</h2>
                <p className="mt-1 text-sm text-slateNavy/60">Contract values, client incidentals, and operational status by wedding</p>
              </div>
              <span className="rounded-full border border-champagneGold/30 bg-white px-3 py-1 text-xs font-semibold text-slateNavy">
                Showing {filteredWeddings.length} of {records.length}
              </span>
            </div>
            {filteredWeddings.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <CheckCircle2 size={24} className="mx-auto text-slate-400" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-slateNavy">No weddings match these filters.</p>
                <p className="mt-1 text-sm text-slateNavy/60">Choose a different location or status to view the season portfolio.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[58rem] text-left text-sm">
                  <caption className="sr-only">Season wedding venue, client, date, guests, contract value, and status</caption>
                  <thead className="bg-slateLight text-xs uppercase tracking-wide text-slateNavy/70">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Client / Venue</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Location</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Wedding Date</th>
                      <th scope="col" className="px-5 py-3 text-center font-semibold">Guests</th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">Contracted Value</th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">Incidentals Billed</th>
                      <th scope="col" className="px-5 py-3 text-center font-semibold">Operational Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-champagneGold/20">
                    {filteredWeddings.map((wedding) => (
                      <tr key={wedding.id} className="transition-colors hover:bg-white/70">
                        <th scope="row" className="px-5 py-4 font-medium text-slateNavy">
                          <span className="block whitespace-nowrap">{wedding.couple}</span>
                          <span className="mt-0.5 block text-xs font-normal text-slateNavy/65">{wedding.venue}</span>
                        </th>
                        <td className="px-5 py-4">
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">{wedding.city}</span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slateNavy/80">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={14} className="text-royalMaroon" aria-hidden="true" />
                            {formatWeddingDate(wedding.date)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center gap-1.5 text-slateNavy">
                            <Users size={14} className="text-slateNavy/60" aria-hidden="true" />
                            {wedding.guests.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-slateNavy">{formatINR(wedding.baseCents)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-slateNavy/80">
                          {wedding.extrasCents === 0n ? '—' : formatINR(wedding.extrasCents)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            wedding.status === 'LIVE_BIG_DAY'
                              ? 'border-emeraldSuccess/30 bg-emeraldSuccess/10 text-emeraldSuccess'
                              : wedding.status === 'RECONCILED'
                                ? 'border-champagneGold/40 bg-champagneGoldLight/40 text-slateNavy'
                                : 'border-slate-200 bg-white text-slate-600'
                          }`}>
                            {wedding.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

export default FounderSeasonDashboard;
