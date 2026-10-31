import { motion } from 'framer-motion';
import { CalendarDays, Check, Clock3, MapPin, Radio } from 'lucide-react';

const sampleEvents = [
  { id: 1, title: 'Groom Baraat', time: '16:30', location: 'Palace Courtyard', status: 'COMPLETED' },
  { id: 2, title: 'Varmala Ceremony', time: '18:00', location: 'Garden Pavilion', status: 'ACTIVE' },
  { id: 3, title: 'Pheras', time: '20:15', location: 'Mandap', status: 'PENDING' },
  { id: 4, title: 'Reception', time: '22:00', location: 'Grand Ballroom', status: 'PENDING' },
];

function LiveScheduleTimeline({ events = sampleEvents, loading = false, error = null }) {
  return (
    <section aria-labelledby="live-schedule-title" className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="rounded-xl bg-champagneGoldLight p-3 text-royalMaroon" aria-hidden="true">
          <CalendarDays size={22} />
        </span>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-royalMaroon">Wedding day</p>
          <h2 id="live-schedule-title" className="text-2xl font-semibold text-slateNavy">Live Schedule</h2>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-rubyDanger/30 bg-rubyDanger/10 px-4 py-3 text-sm text-rubyDanger">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-champagneGold/30 bg-creamIvory p-5 shadow-sm sm:p-7">
        {loading ? (
          <p role="status" className="py-10 text-center text-sm text-slateNavy/60">Loading the wedding schedule…</p>
        ) : events.length === 0 ? (
          <p className="py-10 text-center text-sm text-slateNavy/60">No schedule events have been added yet.</p>
        ) : (
          <ol className="space-y-0">
            {events.map((event, index) => {
              const isActive = event.status === 'ACTIVE';
              const isComplete = event.status === 'COMPLETED';

              return (
                <motion.li
                  key={event.id}
                  className="relative grid grid-cols-[4.5rem_1.5rem_minmax(0,1fr)] gap-3 pb-8 last:pb-0 sm:grid-cols-[5.5rem_2rem_minmax(0,1fr)] sm:gap-4"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  {index < events.length - 1 && (
                    <span className="absolute bottom-0 left-[5.25rem] top-8 w-px bg-champagneGold/50 sm:left-[6.5rem]" aria-hidden="true" />
                  )}
                  <time className="pt-1 text-sm font-semibold tabular-nums text-slateNavy">{event.time}</time>
                  <span className="relative z-10 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-creamIvory">
                    {isActive ? (
                      <span className="relative flex h-3 w-3" aria-label="Active event">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emeraldSuccess opacity-50" />
                        <Radio size={12} className="relative text-emeraldSuccess" aria-hidden="true" />
                      </span>
                    ) : isComplete ? (
                      <Check size={16} className="text-emeraldSuccess" aria-label="Completed" />
                    ) : (
                      <Clock3 size={15} className="text-slateNavy/40" aria-label="Upcoming" />
                    )}
                  </span>
                  <article className={`rounded-xl border p-4 ${isActive ? 'border-emeraldSuccess/40 bg-emeraldSuccess/5' : 'border-champagneGold/20 bg-white'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-slateNavy">{event.title}</h3>
                      {isActive && <span className="rounded-full bg-emeraldSuccess/10 px-2.5 py-1 text-xs font-semibold text-emeraldSuccess">Live now</span>}
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slateNavy/65">
                      <MapPin size={14} aria-hidden="true" />
                      {event.location}
                    </p>
                  </article>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}

export default LiveScheduleTimeline;
