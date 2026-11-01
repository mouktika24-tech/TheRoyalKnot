import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  Filter,
  Phone,
  Search,
  Users,
  X,
} from 'lucide-react';

const INITIAL_VENDORS = [
  {
    checkin_id: 1,
    business_name: 'Royal Rajputana Caterers',
    category: 'CATERER',
    contact_name: 'Mahesh Sharma',
    phone: '+91 98290 12345',
    scheduled_arrival_time: '11:00',
    actual_arrival_time: '10:45',
    status: 'ARRIVED',
    notes_remarks: 'All 8 live food counters unloaded and prep begun.',
  },
  {
    checkin_id: 2,
    business_name: 'Mewari Royal Sound & DJ Console',
    category: 'DJ_SOUND',
    contact_name: 'DJ Bunty',
    phone: '+91 98291 23456',
    scheduled_arrival_time: '13:30',
    actual_arrival_time: '14:15',
    status: 'DELAYED',
    notes_remarks: 'Delayed by highway traffic; backup console requested at stage.',
  },
  {
    checkin_id: 3,
    business_name: 'Jaipur Floral Mandap Decorators',
    category: 'FLORIST',
    contact_name: 'Kavita Rathore',
    phone: '+91 98292 34567',
    scheduled_arrival_time: '12:00',
    actual_arrival_time: '11:50',
    status: 'ARRIVED',
    notes_remarks: 'Mandap marigold and jasmine canopy installation in progress.',
  },
  {
    checkin_id: 4,
    business_name: 'Royal Heritage Brass & Dholak Band',
    category: 'DRUMMERS',
    contact_name: 'Ustad Salamat Ali',
    phone: '+91 98293 45678',
    scheduled_arrival_time: '15:00',
    actual_arrival_time: '',
    status: 'PENDING',
    notes_remarks: 'En route to main palace gate for the 16:00 Baraat.',
  },
  {
    checkin_id: 5,
    business_name: 'ShutterCraft Cinema & Drone Ops',
    category: 'PHOTOGRAPHER',
    contact_name: 'Rohit Verma',
    phone: '+91 98294 56789',
    scheduled_arrival_time: '13:00',
    actual_arrival_time: '12:50',
    status: 'ARRIVED',
    notes_remarks: '4 cameras and 2 drones cleared palace security.',
  },
  {
    checkin_id: 6,
    business_name: 'Royal Bridal & Guest Glow Lounge',
    category: 'MAKEUP',
    contact_name: 'Priya Mehra',
    phone: '+91 98295 67890',
    scheduled_arrival_time: '12:30',
    actual_arrival_time: '12:20',
    status: 'ARRIVED',
    notes_remarks: 'Bride and 6 bridesmaids makeup suite active.',
  },
  {
    checkin_id: 7,
    business_name: 'Heritage Vintage Cars & Shuttles',
    category: 'TRANSPORT',
    contact_name: 'Karan Singh',
    phone: '+91 98296 78901',
    scheduled_arrival_time: '14:30',
    actual_arrival_time: '',
    status: 'PENDING',
    notes_remarks: '1938 Rolls Royce and 4 guest golf carts staged.',
  },
  {
    checkin_id: 8,
    business_name: 'Palace Stage Laser & Cold Pyro Works',
    category: 'DECORATOR',
    contact_name: 'Naveen Joshi',
    phone: '+91 98297 89012',
    scheduled_arrival_time: '16:00',
    actual_arrival_time: '',
    status: 'PENDING',
    notes_remarks: 'Scheduled to install cold sparklers around the stage.',
  },
];

const CATEGORIES = [
  'CATERER',
  'DJ_SOUND',
  'FLORIST',
  'DRUMMERS',
  'PHOTOGRAPHER',
  'MAKEUP',
  'TRANSPORT',
  'DECORATOR',
];

const CATEGORY_TAGS = {
  CATERER: 'border-amber-200 bg-amber-50 text-amber-800',
  DJ_SOUND: 'border-purple-200 bg-purple-50 text-purple-800',
  FLORIST: 'border-pink-200 bg-pink-50 text-pink-800',
  DRUMMERS: 'border-orange-200 bg-orange-50 text-orange-800',
  PHOTOGRAPHER: 'border-blue-200 bg-blue-50 text-blue-800',
  MAKEUP: 'border-rose-200 bg-rose-50 text-rose-800',
  TRANSPORT: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  DECORATOR: 'border-indigo-200 bg-indigo-50 text-indigo-800',
};

const STATUS_CLASSES = {
  ARRIVED: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  DELAYED: 'animate-pulse border-rose-300 bg-rose-100 text-rose-800',
  PENDING: 'border-slate-200 bg-slate-100 text-slate-700',
};

function normalizeVendor(vendor, index) {
  if (!vendor || typeof vendor !== 'object') return null;

  const checkinId = vendor.checkin_id ?? vendor.id;
  const scheduled = vendor.scheduled_arrival_time ?? vendor.scheduled;
  const actual = vendor.actual_arrival_time ?? vendor.actual ?? '';
  const businessName = vendor.business_name ?? vendor.name;
  const status = ['ARRIVED', 'DELAYED', 'PENDING'].includes(vendor.status)
    ? vendor.status
    : 'PENDING';

  if (
    checkinId === undefined
    || typeof businessName !== 'string'
    || typeof vendor.category !== 'string'
    || typeof scheduled !== 'string'
  ) return null;

  return {
    ...vendor,
    checkin_id: checkinId ?? `vendor-${index}`,
    business_name: businessName,
    category: vendor.category,
    contact_name: typeof vendor.contact_name === 'string' ? vendor.contact_name : 'Contact not provided',
    phone: typeof vendor.phone === 'string' ? vendor.phone : '',
    scheduled_arrival_time: scheduled,
    actual_arrival_time: typeof actual === 'string' ? actual : '',
    status,
    notes_remarks: typeof vendor.notes_remarks === 'string' ? vendor.notes_remarks : '',
  };
}

function formatTimeNow() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getErrorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function VendorCheckinBoard({
  vendors: suppliedVendors,
  loading = false,
  error: externalError = null,
  onCheckinChange,
}) {
  const [vendors, setVendors] = useState(() => (
    (Array.isArray(suppliedVendors) ? suppliedVendors : INITIAL_VENDORS)
      .map(normalizeVendor)
      .filter(Boolean)
  ));
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVendor, setActiveVendor] = useState(null);
  const [actualTime, setActualTime] = useState('');
  const [checkinStatus, setCheckinStatus] = useState('ARRIVED');
  const [remarks, setRemarks] = useState('');
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [actionError, setActionError] = useState('');
  const [formError, setFormError] = useState('');
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(suppliedVendors)) {
      setVendors(suppliedVendors.map(normalizeVendor).filter(Boolean));
    }
  }, [suppliedVendors]);

  useEffect(() => {
    if (!activeVendor) return undefined;

    const previousFocus = document.activeElement;
    firstInputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActiveVendor(null);
        setFormError('');
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [activeVendor]);

  const totalVendors = vendors.length;
  const arrivedCount = vendors.filter((vendor) => vendor.status === 'ARRIVED').length;
  const pendingCount = vendors.filter((vendor) => vendor.status === 'PENDING').length;
  const delayedCount = vendors.filter((vendor) => vendor.status === 'DELAYED').length;
  const errorMessage = actionError || (
    typeof externalError === 'string'
      ? externalError
      : externalError instanceof Error
        ? externalError.message
        : externalError
          ? 'Vendor check-ins could not be loaded.'
          : ''
  );

  const filteredVendors = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return vendors.filter((vendor) => {
      const matchesCategory = selectedCategory === 'ALL' || vendor.category === selectedCategory;
      const matchesSearch = !query
        || vendor.business_name.toLocaleLowerCase().includes(query)
        || vendor.contact_name.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [vendors, selectedCategory, searchQuery]);

  const openCheckinModal = (vendor) => {
    setActiveVendor(vendor);
    setActualTime(vendor.actual_arrival_time || formatTimeNow());
    setCheckinStatus(vendor.status === 'PENDING' ? 'ARRIVED' : vendor.status);
    setRemarks(vendor.notes_remarks);
    setActionError('');
    setFormError('');
  };

  const saveCheckin = async (event) => {
    event.preventDefault();
    if (!activeVendor) return;

    if (!/^\d{2}:\d{2}$/.test(actualTime)) {
      setFormError('Enter an arrival time in 24-hour HH:MM format.');
      return;
    }

    const previousVendor = activeVendor;
    const updatedVendor = {
      ...activeVendor,
      actual_arrival_time: actualTime,
      status: checkinStatus,
      notes_remarks: remarks.trim(),
    };

    setFormError('');
    setActionError('');
    setPendingIds((current) => new Set(current).add(activeVendor.checkin_id));
    setVendors((current) => current.map((vendor) => (
      vendor.checkin_id === activeVendor.checkin_id ? updatedVendor : vendor
    )));
    setActiveVendor(null);

    try {
      const savedVendor = await onCheckinChange?.(updatedVendor.checkin_id, {
        actual_arrival_time: updatedVendor.actual_arrival_time,
        status: updatedVendor.status,
        notes_remarks: updatedVendor.notes_remarks,
      });

      if (savedVendor && typeof savedVendor === 'object') {
        const normalizedSaved = normalizeVendor(savedVendor, 0);
        if (normalizedSaved) {
          setVendors((current) => current.map((vendor) => (
            vendor.checkin_id === updatedVendor.checkin_id ? normalizedSaved : vendor
          )));
        }
      }
    } catch (saveError) {
      setVendors((current) => current.map((vendor) => (
        vendor.checkin_id === previousVendor.checkin_id ? previousVendor : vendor
      )));
      setActionError(getErrorMessage(saveError, 'Could not save this arrival log. The previous check-in has been restored.'));
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(previousVendor.checkin_id);
        return next;
      });
    }
  };

  return (
    <section aria-labelledby="vendor-checkin-title" className="min-h-screen bg-[#FFFDF9] p-4 text-[#2A211D] sm:p-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[#ECE7E1] pb-5 md:flex-row md:items-center">
        <div>
          <p className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-[#8C827A]">THE ROYAL KNOT WORKSPACE</p>
          <h1 id="vendor-checkin-title" className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#2A211D]">Vendor Arrival Tracker</h1>
          <p className="mt-1 text-sm text-[#7A7067]">Monitor vendor arrivals, scheduled checkpoints, and on-site delay notes.</p>
        </div>
      </header>

      {errorMessage && (
        <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMessage}
        </p>
      )}

      <section aria-label="Vendor arrival summary" className="my-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Assigned vendors</span>
            <Users size={17} className="text-slate-400" aria-hidden="true" />
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalVendors}</p>
        </article>
        <article className="rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-emerald-800">Checked in</span>
            <CheckCircle2 size={17} className="text-emerald-600" aria-hidden="true" />
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{arrivedCount}</p>
        </article>
        <article className="rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-amber-800">En route / pending</span>
            <Clock3 size={17} className="text-amber-600" aria-hidden="true" />
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-700">{pendingCount}</p>
        </article>
        <article className={`rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-sm transition-colors ${delayedCount ? 'ring-1 ring-rose-200' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-rose-800">Delayed alerts</span>
            <AlertTriangle size={17} className={delayedCount ? 'animate-pulse text-rose-600' : 'text-slate-400'} aria-hidden="true" />
          </div>
          <p className="mt-1 text-2xl font-bold text-rose-700">{delayedCount}</p>
        </article>
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Search vendor or contact</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search vendor or contact…"
            className="min-h-10 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#722F37] focus:outline-none focus:ring-1 focus:ring-[#722F37]"
          />
        </label>
        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 sm:max-w-xs">
          <span className="sr-only">Filter vendors by category</span>
          <Filter size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="min-h-9 w-full bg-transparent text-sm text-slate-700 focus:outline-none"
          >
            <option value="ALL">All categories</option>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category.replaceAll('_', ' ')}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <p role="status" className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Loading vendor check-ins…
        </p>
      ) : filteredVendors.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
          {vendors.length === 0 ? 'No vendors are scheduled to check in.' : 'No vendors match your search or category.'}
        </p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {filteredVendors.map((vendor, index) => {
              const isDelayed = vendor.status === 'DELAYED';
              const isArrived = vendor.status === 'ARRIVED';
              const isSaving = pendingIds.has(vendor.checkin_id);

              return (
                <motion.li
                  key={vendor.checkin_id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: index * 0.025 }}
                >
                  <article className={`flex h-full flex-col justify-between rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
                    isDelayed
                      ? 'border-rose-400 bg-rose-50/30 ring-1 ring-rose-300'
                      : isArrived
                        ? 'border-emerald-300 hover:border-emerald-400'
                        : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_TAGS[vendor.category] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                          {vendor.category.replaceAll('_', ' ')}
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[vendor.status] || STATUS_CLASSES.PENDING}`}>
                          {vendor.status}
                        </span>
                      </div>

                      <h2 className="text-base font-bold leading-snug text-slate-900">{vendor.business_name}</h2>
                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        <p className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-slate-400" aria-hidden="true" />
                          <span>Contact: <strong className="font-medium text-slate-700">{vendor.contact_name}</strong></span>
                        </p>
                        {vendor.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone size={14} className="text-slate-400" aria-hidden="true" />
                            <a href={`tel:${vendor.phone.replace(/[^\d+]/g, '')}`} className="font-mono text-slate-600 hover:text-[#722F37] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#722F37]">
                              {vendor.phone}
                            </a>
                          </p>
                        )}
                      </div>

                      <dl className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                        <div>
                          <dt className="text-[11px] text-slate-500">Scheduled</dt>
                          <dd className="font-mono text-sm font-semibold text-slate-800">{vendor.scheduled_arrival_time}</dd>
                        </div>
                        <div className="text-right">
                          <dt className="text-[11px] text-slate-500">Actual</dt>
                          <dd className={`font-mono text-sm ${vendor.actual_arrival_time ? 'font-bold text-slate-900' : 'italic text-slate-400'}`}>
                            {vendor.actual_arrival_time || '--:--'}
                          </dd>
                        </div>
                      </dl>

                      {vendor.notes_remarks && (
                        <p className="mt-3 rounded border border-slate-100 bg-slate-50/70 p-2 text-xs italic text-slate-600">
                          {vendor.notes_remarks}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-end border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => openCheckinModal(vendor)}
                        disabled={loading || isSaving}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#722F37] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8B3A44] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] disabled:cursor-wait disabled:opacity-60"
                      >
                        <Clock3 size={14} aria-hidden="true" />
                        {isSaving ? 'Saving…' : vendor.status === 'PENDING' ? 'Check in vendor' : 'Update arrival / delay'}
                      </button>
                    </div>
                  </article>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {activeVendor && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-white/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setActiveVendor(null);
                setFormError('');
              }
            }}
          >
            <motion.section
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="vendor-checkin-modal-title"
              className="my-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <header className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h2 id="vendor-checkin-modal-title" className="text-base font-bold text-slate-900">Check in vendor arrival</h2>
                  <p className="text-xs text-slate-500">{activeVendor.business_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveVendor(null);
                    setFormError('');
                  }}
                  aria-label="Close check-in dialog"
                  className="rounded p-1 text-slate-400 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#722F37]"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </header>

              <form onSubmit={saveCheckin} className="mt-4 space-y-4">
                {formError && (
                  <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {formError}
                  </p>
                )}
                <p className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                  <span className="text-slate-500">Scheduled arrival</span>
                  <span className="font-mono font-bold text-[#722F37]">{activeVendor.scheduled_arrival_time} (24h)</span>
                </p>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Actual arrival time (24-hour HH:MM)</span>
                  <input
                    ref={firstInputRef}
                    type="time"
                    required
                    value={actualTime}
                    onChange={(event) => setActualTime(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-[#722F37] focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                  />
                </label>

                <fieldset>
                  <legend className="mb-1 text-xs font-semibold text-slate-700">Arrival status</legend>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      aria-pressed={checkinStatus === 'ARRIVED'}
                      onClick={() => setCheckinStatus('ARRIVED')}
                      className={`rounded-lg border py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#722F37] ${
                        checkinStatus === 'ARRIVED'
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      On time / arrived
                    </button>
                    <button
                      type="button"
                      aria-pressed={checkinStatus === 'DELAYED'}
                      onClick={() => setCheckinStatus('DELAYED')}
                      className={`rounded-lg border py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#722F37] ${
                        checkinStatus === 'DELAYED'
                          ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Delayed alert
                    </button>
                  </div>
                </fieldset>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">On-site logistics remarks</span>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    placeholder="Add arrival details or incident notes"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#722F37] focus:outline-none focus:ring-1 focus:ring-[#722F37]"
                  />
                </label>

                <footer className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveVendor(null);
                      setFormError('');
                    }}
                    className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#722F37]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#722F37] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#8B3A44] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
                  >
                    Save arrival log
                  </button>
                </footer>
              </form>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default VendorCheckinBoard;
