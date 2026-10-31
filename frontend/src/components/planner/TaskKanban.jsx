import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock3, ClipboardList } from 'lucide-react';

const columns = [
  { id: 'TO_PLAN', title: 'To Plan', icon: Circle, accent: 'text-slateNavy' },
  { id: 'IN_PROGRESS', title: 'In Progress', icon: Clock3, accent: 'text-champagneGold' },
  { id: 'DONE', title: 'Done', icon: CheckCircle2, accent: 'text-emeraldSuccess' },
];

const sampleTasks = [
  { id: 1, title: 'Confirm palace venue availability', category: 'VENUE', stage: 'TO_PLAN', dueDate: 'Nov 12' },
  { id: 2, title: 'Finalize welcome dinner decor', category: 'DESIGN_DECOR', stage: 'IN_PROGRESS', dueDate: 'Nov 15' },
  { id: 3, title: 'Shortlist Mehendi artists', category: 'MEHENDI', stage: 'DONE', dueDate: 'Nov 10' },
];

function TaskKanban({ tasks = sampleTasks, loading = false, error = null }) {
  return (
    <section aria-labelledby="task-kanban-title" className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="rounded-xl bg-champagneGoldLight p-3 text-royalMaroon" aria-hidden="true">
          <ClipboardList size={22} />
        </span>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-royalMaroon">Wedding operations</p>
          <h2 id="task-kanban-title" className="text-2xl font-semibold text-slateNavy">Instant Plan</h2>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-rubyDanger/30 bg-rubyDanger/10 px-4 py-3 text-sm text-rubyDanger">
          {error}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {columns.map(({ id, title, icon: Icon, accent }, index) => {
          const columnTasks = tasks.filter((task) => task.stage === id);

          return (
            <motion.section
              key={id}
              aria-labelledby={`task-column-${id}`}
              className="min-h-64 rounded-2xl border border-champagneGold/30 bg-creamIvory p-4 shadow-sm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.06 }}
            >
              <div className="mb-4 flex items-center justify-between border-b border-champagneGold/30 pb-3">
                <h3 id={`task-column-${id}`} className="flex items-center gap-2 font-semibold text-slateNavy">
                  <Icon size={18} className={accent} aria-hidden="true" />
                  {title}
                </h3>
                <span className="rounded-full bg-slateLight px-2.5 py-1 text-xs font-medium text-slateNavy" aria-label={`${columnTasks.length} tasks`}>
                  {columnTasks.length}
                </span>
              </div>

              {loading ? (
                <p role="status" className="py-8 text-center text-sm text-slateNavy/60">Loading tasks…</p>
              ) : columnTasks.length === 0 ? (
                <p className="py-8 text-center text-sm text-slateNavy/60">No tasks in this stage.</p>
              ) : (
                <ul className="space-y-3">
                  {columnTasks.map((task) => (
                    <li key={task.id}>
                      <article className="rounded-xl border border-champagneGold/20 bg-white p-4 shadow-sm">
                        <p className="font-medium leading-snug text-slateNavy">{task.title}</p>
                        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slateNavy/65">
                          <span className="rounded-full bg-champagneGoldLight/60 px-2 py-1">{task.category.replaceAll('_', ' ')}</span>
                          <span>Due {task.dueDate}</span>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          );
        })}
      </div>
    </section>
  );
}

export default TaskKanban;
