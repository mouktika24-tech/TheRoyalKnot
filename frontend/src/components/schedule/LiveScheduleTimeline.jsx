import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  Check,
  MapPin,
  Plus,
  Radio,
  UserRound,
  X,
} from 'lucide-react';

const STATUSES = [
  { key: 'PENDING', label: 'Pending', classes: 'border-slate-700 bg-white text-slate-700' },
  { key: 'ACTIVE', label: 'Live Now', classes: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400' },
  { key: 'COMPLETED', label: 'Completed', classes: 'border-blue-500/40 bg-blue-500/20 text-blue-400' },
  { key: 'DELAYED', label: 'Delayed', classes: 'animate-pulse border-[#EF4444]/40 bg-[#EF4444]/15 text-[#F87171]' },
];

const INITIAL_EVENTS = [
  { event_id: 1, title: 'Bride & Groom Royal Portrait Session', event_time: '14:00', location: 'Palace Gardens & Peacock Courtyard', responsible_person: 'Ananya (Vendor Ops)', status: 'COMPLETED', notes: 'Drone shots and vintage corridor portraits finalized.' },
  { event_id: 2, title: 'Rajasthani Dholak & Welcome Drummer Staging', event_time: '15:30', location: 'Grand Heritage Porch', responsible_person: 'Vikram (Logistics)', status: 'COMPLETED', notes: '12 drummers stationed; cold rose water served.' },
  { event_id: 3, title: 'Groom Baraat Procession & Vintage Car Arrival', event_time: '16:00', location: 'Main Palace Gate → Central Driveway', responsible_person: 'Vikram (Logistics)', status: 'ACTIVE', notes: 'Vintage 1938 Rolls Royce leading; guest flower showers underway.' },
  { event_id: 4, title: 'Varmala Royal Garland Exchange', event_time: '17:30', location: 'Courtyard Elevated Marble Stage', responsible_person: 'Aarav (Decor Lead)', status: 'PENDING', notes: 'Fresh lotus garlands inspected and kept chilled.' },
  { event_id: 5, title: 'Vedic Pheras & Wedding Vows', event_time: '19:00', location: 'Lakeside Heritage Mandap', responsible_person: 'Pooja (Hospitality)', status: 'PENDING', notes: 'Priest samagri ready; 400 cushioned royal chairs arranged.' },
  { event_id: 6, title: 'Royal Feast & Grand Banquet Reception', event_time: '20:30', location: 'Grand Maharani Ballroom', responsible_person: 'Vikram (Logistics)', status: 'PENDING', notes: 'Caterer live stations prepped; couple grand spotlight entry synced.' },
  { event_id: 7, title: 'Bidaai Ceremony & Royal Vintage Departure', event_time: '23:00', location: 'East Archway Gate', responsible_person: 'Pooja (Hospitality)', status: 'PENDING', notes: 'Luggage transport vehicles dispatched to airport and hotels.' },
];

function normalizeEvent(event, index) {
  if (!event || typeof event !== 'object') return null;

  const title = typeof event.title === 'string' ? event.title.trim() : '';
  const time = event.event_time ?? event.time;
  const location = typeof event.location === 'string' ? event.location.trim() : '';
  const coordinator = event.responsible_person ?? event.coordinator ?? '';
  const status = STATUSES.some((item) => item.key === event.status) ? event.status : 'PENDING';
  const [hours, minutes] = typeof time === 'string' ? time.split(':').map(Number) : [];

  if (
    !title
    || typeof time !== 'string'
    || !/^\d{2}:\d{2}$/.test(time)
    || hours > 23
    || minutes > 59
    || !location
  ) return null;

  return {
    ...event,
    event_id: event.event_id ?? event.id ?? `event-${index}-${time}-${title}`,
    title,
    event_time: time,
    location,
    responsible_person: typeof coordinator === 'string' && coordinator.trim()
      ? coordinator.trim()
      : 'Wedding coordinator',
    notes: typeof event.notes === 'string' ? event.notes.trim() : '',
    status,
  };
}

function sortEvents(events) {
  return [...events].sort((a, b) => a.event_time.localeCompare(b.event_time));
}

function getErrorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatStatus(status) {
  return STATUSES.find((item) => item.key === status)?.label ?? 'Pending';
}

function LiveScheduleTimeline({
  events: suppliedEvents,
  loading = false,
  error: externalError = null,
  onAddEvent,
  onStatusChange,
}) {
  const [events, setEvents] = useState(() => sortEvents(
    (Array.isArray(suppliedEvents) ? suppliedEvents : INITIAL_EVENTS)
      .map(normalizeEvent)
      .filter(Boolean),
  ));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingEventIds, setPendingEventIds] = useState(() => new Set());
  const [actionError, setActionError] = useState('');
  const [formError, setFormError] = useState('');
  const modalRef = useRef(null);
  const addButtonRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (Array.isArray(suppliedEvents)) {
      setEvents(sortEvents(suppliedEvents.map(normalizeEvent).filter(Boolean)));
    }
  }, [suppliedEvents]);

  useEffect(() => {
    if (!isAddModalOpen) return undefined;

    const previousFocus = document.activeElement;
    titleInputRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsAddModalOpen(false);
        setFormError('');
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled])',
      );
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
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
      else addButtonRef.current?.focus();
    };
  }, [isAddModalOpen]);

  const sortedEvents = useMemo(() => sortEvents(events), [events]);
  const activeEvent = sortedEvents.find((event) => event.status === 'ACTIVE');
  const errorMessage = actionError || (
    typeof externalError === 'string'
      ? externalError
      : externalError instanceof Error
        ? externalError.message
        : externalError
          ? 'The wedding schedule could not be loaded.'
          : ''
  );

  const updateEventStatus = async (event, status) => {
    if (event.status === status || pendingEventIds.size > 0) return;

    const previousStatuses = new Map(events.map((item) => [item.event_id, item.status]));
    setActionError('');
    setPendingEventIds((current) => new Set(current).add(event.event_id));
    setEvents((current) => current.map((item) => (
      item.event_id === event.event_id
        ? { ...item, status }
        : status === 'ACTIVE' && item.status === 'ACTIVE'
          ? { ...item, status: 'PENDING' }
          : item
    )));

    try {
      await onStatusChange?.(event.event_id, status);
    } catch (statusError) {
      setEvents((current) => current.map((item) => (
        previousStatuses.has(item.event_id)
          ? { ...item, status: previousStatuses.get(item.event_id) }
          : item
      )));
      setActionError(getErrorMessage(statusError, 'Could not update event status. The previous status has been restored.'));
    } finally {
      setPendingEventIds((current) => {
        const next = new Set(current);
        next.delete(event.event_id);
        return next;
      });
    }
  };

  const addScheduleEvent = async (formEvent) => {
    formEvent.preventDefault();
    setFormError('');
    setActionError('');

    const formData = new FormData(formEvent.currentTarget);
    const newEvent = {
      event_id: `custom-${Date.now()}`,
      title: String(formData.get('title') ?? '').trim(),
      event_time: String(formData.get('event_time') ?? ''),
      location: String(formData.get('location') ?? '').trim(),
      responsible_person: String(formData.get('responsible_person') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
      status: 'PENDING',
    };

    const normalizedEvent = normalizeEvent(newEvent, events.length);
    if (!normalizedEvent) {
      setFormError('Enter an event name, a valid time, and a venue location.');
      return;
    }

    const previousEvents = events;
    setEvents((current) => sortEvents([...current, normalizedEvent]));
    setIsAddModalOpen(false);

    try {
      const createdEvent = await onAddEvent?.(normalizedEvent);
      if (createdEvent && typeof createdEvent === 'object') {
        const normalizedCreatedEvent = normalizeEvent(createdEvent, events.length);
        if (normalizedCreatedEvent) {
          setEvents((current) => sortEvents(current.map((item) => (
            item.event_id === normalizedEvent.event_id ? normalizedCreatedEvent : item
          ))));
        }
      }
    } catch (addError) {
      setEvents(previousEvents);
      setActionError(getErrorMessage(addError, 'Could not add event. The previous schedule has been restored.'));
    }
  };

  return (
    <section aria-labelledby="live-schedule-title" className="min-h-screen space-y-6 rounded-2xl bg-white p-4 text-slate-900 sm:p-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-[#722F37]/30 p-3 text-[#D4AF37]" aria-hidden="true">
            <CalendarDays size={22} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">Rambagh Palace, Jaipur</p>
            <h1 id="live-schedule-title" className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">The Big Day Schedule</h1>
            <p className="mt-1 text-sm text-slate-400">Winter Destination Wedding</p>
          </div>
        </div>
        <button
          ref={addButtonRef}
          type="button"
          onClick={() => {
            setFormError('');
            setIsAddModalOpen(true);
          }}
          disabled={loading}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#722F37] to-[#8B3A44] px-4 py-2.5 text-sm font-semibold text-[#FFFDF9] shadow-md shadow-[#722F37]/30 transition hover:from-[#8B3A44] hover:to-[#A0424E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={17} aria-hidden="true" />
          Add Event
        </button>
      </header>

      {errorMessage && (
        <p role="alert" className="rounded-xl border border-[#EF4444]/40 bg-white px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </p>
      )}

      <section aria-label="Current live event" aria-live="polite">
        {activeEvent ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-white p-4 shadow-lg shadow-emerald-950/20 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="relative mt-1 flex h-3.5 w-3.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">Current live event · {activeEvent.event_time} IST</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">{activeEvent.title}</h2>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound size={15} aria-hidden="true" />
                    Lead: {activeEvent.responsible_person}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={15} aria-hidden="true" />
                    {activeEvent.location}
                  </span>
                </div>
              </div>
            </div>
            <span className="ml-6 mt-3 inline-flex w-fit rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 sm:mt-0">
              LIVE
            </span>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-white px-5 py-4 text-sm text-slate-600">
            No event is currently active. Set an event to Active to feature it here.
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-slate-800 bg-white p-4 shadow-sm sm:p-6">
        {loading ? (
          <p role="status" className="py-10 text-center text-sm text-slate-400">Loading the wedding schedule…</p>
        ) : sortedEvents.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarDays size={28} className="mx-auto mb-3 text-[#D4AF37]" aria-hidden="true" />
            <p className="text-sm text-slate-400">No schedule events have been added yet.</p>
          </div>
        ) : (
          <ol className="space-y-0">
            {sortedEvents.map((event, index) => {
              const isActive = event.status === 'ACTIVE';
              const status = STATUSES.find((item) => item.key === event.status) ?? STATUSES[0];
              const isPending = pendingEventIds.has(event.event_id);

              return (
                <motion.li
                  key={event.event_id}
                  layout
                  className="relative grid grid-cols-[3.75rem_1.5rem_minmax(0,1fr)] gap-2.5 pb-7 last:pb-0 sm:grid-cols-[5rem_2rem_minmax(0,1fr)] sm:gap-4 sm:pb-8"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.035 }}
                >
                  {index < sortedEvents.length - 1 && (
                    <span
                      className="absolute bottom-0 left-[4.5rem] top-8 w-0.5 bg-gradient-to-b from-[#D4AF37]/60 via-slate-700 to-slate-800 sm:left-[6rem]"
                      aria-hidden="true"
                    />
                  )}
                  <time className="pt-1 text-sm font-bold tabular-nums text-[#D4AF37] sm:text-base">
                    {event.event_time}
                  </time>
                  <span className={`relative z-10 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border bg-white ring-4 ring-white ${isActive ? 'border-emerald-500' : event.status === 'COMPLETED' ? 'border-blue-500' : event.status === 'DELAYED' ? 'border-[#EF4444]' : 'border-slate-700'}`}>
                    {isActive ? (
                      <span className="relative flex h-3.5 w-3.5" aria-label="Active event">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
                      </span>
                    ) : event.status === 'COMPLETED' ? (
                      <Check size={17} className="text-blue-400" aria-label="Completed event" />
                    ) : event.status === 'DELAYED' ? (
                      <span className="h-3 w-3 rounded-full bg-[#EF4444]" aria-label="Delayed event" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full border-2 border-slate-500 bg-white" aria-label="Pending event" />
                    )}
                  </span>
                  <article className={`min-w-0 rounded-xl border p-4 transition-colors sm:p-5 ${
                    isActive
                      ? 'border-emerald-500/60 bg-white shadow-lg shadow-emerald-950/30'
                      : event.status === 'DELAYED'
                        ? 'animate-pulse border-[#EF4444]/50 bg-white'
                        : 'border-slate-800 bg-white hover:border-[#D4AF37]/50'
                  }`}>
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-700 pb-3">
                      <div className="min-w-0">
                        <h2 className="font-semibold leading-snug text-slate-900">{event.title}</h2>
                        <div className="mt-2 flex flex-col gap-1.5 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-5">
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound size={14} className="shrink-0 text-[#D4AF37]" aria-hidden="true" />
                            {event.responsible_person}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={14} className="shrink-0 text-[#D4AF37]" aria-hidden="true" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${status.classes}`}>
                        {formatStatus(event.status)}
                      </span>
                    </div>

                    {event.notes && (
                      <p className="mt-3 border-t border-slate-700 pt-3 text-xs italic text-slate-600">
                        “{event.notes}”
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-700 pt-3">
                      <span className="mr-1 text-xs font-medium text-slate-500">Mark as:</span>
                      {STATUSES.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          aria-pressed={event.status === option.key}
                          aria-label={`${formatStatus(option.key)} status for ${event.title}`}
                          onClick={() => updateEventStatus(event, option.key)}
                          disabled={pendingEventIds.size > 0 || loading}
                          className={`min-h-8 rounded-full border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#D4AF37] disabled:cursor-wait disabled:opacity-50 ${
                            event.status === option.key
                              ? option.classes
                              : 'border-slate-700 bg-white text-slate-600 hover:border-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                      {isPending && <span role="status" className="text-xs text-slate-400">Saving…</span>}
                    </div>
                  </article>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-white/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsAddModalOpen(false);
                setFormError('');
              }
            }}
          >
            <motion.section
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-schedule-event-title"
              className="my-auto w-full max-w-lg rounded-2xl border border-slate-700 bg-white text-slate-900 shadow-2xl"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <header className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">Wedding day schedule</p>
                  <h2 id="add-schedule-event-title" className="mt-1 text-xl font-semibold text-slate-900">Add a ceremony or event</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormError('');
                  }}
                  aria-label="Close add event dialog"
                  className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
                >
                  <X size={19} aria-hidden="true" />
                </button>
              </header>
              <form onSubmit={addScheduleEvent} className="space-y-4 p-5">
                {formError && (
                  <p role="alert" className="rounded-lg border border-[#EF4444]/40 bg-white px-3 py-2 text-sm text-red-800">
                    {formError}
                  </p>
                )}
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Event name</span>
                  <input
                    ref={titleInputRef}
                    name="title"
                    required
                    maxLength={200}
                    placeholder="e.g. Family blessings and aarti"
                    className="min-h-11 w-full rounded-lg border border-slate-700 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Start time</span>
                    <input
                      name="event_time"
                      type="time"
                      required
                      className="min-h-11 w-full rounded-lg border border-slate-700 bg-white px-3 text-sm text-slate-900 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Venue location</span>
                    <input
                      name="location"
                      required
                      maxLength={150}
                      placeholder="e.g. Palace Courtyard"
                      className="min-h-11 w-full rounded-lg border border-slate-700 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Coordinator</span>
                  <input
                    name="responsible_person"
                    maxLength={100}
                    placeholder="Coordinator name or team"
                    className="min-h-11 w-full rounded-lg border border-slate-700 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-slate-700">Logistics notes</span>
                  <textarea
                    name="notes"
                    rows={2}
                    maxLength={500}
                    placeholder="Add key details for the on-site team"
                    className="w-full rounded-lg border border-slate-700 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                  />
                </label>
                <footer className="flex flex-col-reverse justify-end gap-2 border-t border-slate-800 pt-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setFormError('');
                    }}
                    className="min-h-10 rounded-lg border border-slate-700 px-4 text-sm font-medium text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#722F37] px-4 text-sm font-semibold text-white hover:bg-[#8B3A44] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
                  >
                    <Plus size={16} aria-hidden="true" />
                    Add to schedule
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

export default LiveScheduleTimeline;
