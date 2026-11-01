import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { opsApi } from '../../services/opsApi';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Search,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  'VENUE',
  'DESIGN_DECOR',
  'VENDORS',
  'MEHENDI',
  'SANGEET',
  'WEDDING_CEREMONY',
  'RECEPTION',
];

const STAGES = [
  {
    key: 'TO_PLAN',
    title: 'To Plan',
    icon: Circle,
    dot: 'bg-amber-400',
    badge: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    count: 'bg-white text-amber-800',
  },
  {
    key: 'IN_PROGRESS',
    title: 'In Progress',
    icon: Clock3,
    dot: 'bg-amber-400',
    badge: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    count: 'bg-white text-amber-800',
  },
  {
    key: 'DONE',
    title: 'Done',
    icon: CheckCircle2,
    dot: 'bg-emerald-500',
    badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    count: 'bg-emerald-500/10 text-emerald-300',
  },
];

const INITIAL_TASKS = [
  { task_id: 1, title: 'Finalize palace banquet floor plan', category: 'VENUE', owner_name: 'Vikram · Logistics', stage: 'DONE', due_date: 'Day -14' },
  { task_id: 2, title: 'Confirm palace backup generators and fuel', category: 'VENUE', owner_name: 'Vikram · Logistics', stage: 'IN_PROGRESS', due_date: 'Day -7' },
  { task_id: 3, title: 'Prepare room allocation and guest key packets', category: 'VENUE', owner_name: 'Pooja · Hospitality', stage: 'TO_PLAN', due_date: 'Day -3' },
  { task_id: 4, title: 'Secure heritage precinct fire and sound permits', category: 'VENUE', owner_name: 'Vikram · Logistics', stage: 'TO_PLAN', due_date: 'Day -10' },
  { task_id: 5, title: 'Mandap floral canopy walkthrough', category: 'DESIGN_DECOR', owner_name: 'Aarav · Decor Lead', stage: 'IN_PROGRESS', due_date: 'Day -5' },
  { task_id: 6, title: 'Approve royal driveway fairy-light tunnel', category: 'DESIGN_DECOR', owner_name: 'Aarav · Decor Lead', stage: 'TO_PLAN', due_date: 'Day -2' },
  { task_id: 7, title: 'Test courtyard uplighting and truss rig', category: 'DESIGN_DECOR', owner_name: 'Aarav · Decor Lead', stage: 'TO_PLAN', due_date: 'Day -1' },
  { task_id: 8, title: 'Place vintage Maharaja sofa on reception stage', category: 'DESIGN_DECOR', owner_name: 'Aarav · Decor Lead', stage: 'TO_PLAN', due_date: 'Day of Event' },
  { task_id: 9, title: 'Sign off caterer tasting and menu spice balance', category: 'VENDORS', owner_name: 'Ananya · Vendor Ops', stage: 'DONE', due_date: 'Day -12' },
  { task_id: 10, title: 'Sync DJ console audio and lighting cues', category: 'VENDORS', owner_name: 'Ananya · Vendor Ops', stage: 'IN_PROGRESS', due_date: 'Day -1' },
  { task_id: 11, title: 'Brief dhol team and brass band on arrival', category: 'VENDORS', owner_name: 'Ananya · Vendor Ops', stage: 'TO_PLAN', due_date: 'Day of Event' },
  { task_id: 12, title: 'Clear cinematography drone flight with palace', category: 'VENDORS', owner_name: 'Vikram · Logistics', stage: 'TO_PLAN', due_date: 'Day -4' },
  { task_id: 13, title: 'Arrange seating and light kits for henna artists', category: 'MEHENDI', owner_name: 'Pooja · Hospitality', stage: 'DONE', due_date: 'Day -2' },
  { task_id: 14, title: 'Set up organic floral jewellery distribution table', category: 'MEHENDI', owner_name: 'Pooja · Hospitality', stage: 'IN_PROGRESS', due_date: 'Day -2' },
  { task_id: 15, title: 'Confirm welcome sharbat and coconut counter', category: 'MEHENDI', owner_name: 'Vikram · Logistics', stage: 'TO_PLAN', due_date: 'Day -2' },
  { task_id: 16, title: 'Prepare Kalbelia dancers’ green room', category: 'MEHENDI', owner_name: 'Ananya · Vendor Ops', stage: 'TO_PLAN', due_date: 'Day -2' },
  { task_id: 17, title: 'Rehearse family choreography audio sync', category: 'SANGEET', owner_name: 'Ananya · Vendor Ops', stage: 'IN_PROGRESS', due_date: 'Day -1' },
  { task_id: 18, title: 'Verify LED backdrop video resolution and cues', category: 'SANGEET', owner_name: 'Aarav · Decor Lead', stage: 'TO_PLAN', due_date: 'Day -1' },
  { task_id: 19, title: 'Count cocktail bar glassware and ice inventory', category: 'SANGEET', owner_name: 'Vikram · Logistics', stage: 'TO_PLAN', due_date: 'Day -1' },
  { task_id: 20, title: 'Complete safety check for couple grand-entry sparklers', category: 'SANGEET', owner_name: 'Aarav · Decor Lead', stage: 'TO_PLAN', due_date: 'Day -1' },
  { task_id: 21, title: 'Clear Baraat vintage car route with palace security', category: 'WEDDING_CEREMONY', owner_name: 'Vikram · Logistics', stage: 'TO_PLAN', due_date: 'Day of Event' },
  { task_id: 22, title: 'Inspect fresh rose-petal Varmala garlands', category: 'WEDDING_CEREMONY', owner_name: 'Aarav · Decor Lead', stage: 'TO_PLAN', due_date: 'Day of Event' },
  { task_id: 23, title: 'Prepare sacred havan samagri and priest altar', category: 'WEDDING_CEREMONY', owner_name: 'Pooja · Hospitality', stage: 'TO_PLAN', due_date: 'Day of Event' },
  { task_id: 24, title: 'Assign shaded Mandap seating for VIP guests', category: 'WEDDING_CEREMONY', owner_name: 'Pooja · Hospitality', stage: 'TO_PLAN', due_date: 'Day of Event' },
  { task_id: 25, title: 'Sync couple spotlight tracking with entry fanfare', category: 'RECEPTION', owner_name: 'Ananya · Vendor Ops', stage: 'TO_PLAN', due_date: 'Day of Event' },
  { task_id: 26, title: 'Release eight regional dinner buffet stations', category: 'RECEPTION', owner_name: 'Vikram · Logistics', stage: 'TO_PLAN', due_date: 'Day of Event' },
  { task_id: 27, title: 'Coordinate Jaipur sweet hamper distribution', category: 'RECEPTION', owner_name: 'Pooja · Hospitality', stage: 'TO_PLAN', due_date: 'Day of Event' },
  { task_id: 28, title: 'Verify vendor load-out and complete venue handover', category: 'RECEPTION', owner_name: 'Vikram · Logistics', stage: 'TO_PLAN', due_date: 'Day +1' },
];

const isValidStage = (stage) => STAGES.some((item) => item.key === stage);
const isValidCategory = (category) => CATEGORIES.includes(category);

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) return [];

  return tasks.filter((task) => (
    task
    && task.task_id !== undefined
    && task.task_id !== null
    && typeof task.title === 'string'
    && typeof task.owner_name === 'string'
    && isValidCategory(task.category)
    && isValidStage(task.stage)
  ));
}

function formatDueDate(dueDate) {
  if (typeof dueDate !== 'string' || !dueDate.trim()) return 'Date not set';

  const dateOnlyMatch = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parsedDate = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(dueDate);

  if (Number.isNaN(parsedDate.getTime())) return dueDate;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  const daysUntil = Math.round((dueDay - today) / 86_400_000);

  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(daysUntil, 'day');
}

function getErrorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function TaskKanban({
  tasks: suppliedTasks,
  loading = false,
  error: externalError = null,
  onGeneratePlan,
  onTaskStageChange,
}) {
  const [taskList, setTaskList] = useState(() => normalizeTasks(suppliedTasks ?? INITIAL_TASKS));
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingTaskIds, setPendingTaskIds] = useState(() => new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(!Array.isArray(suppliedTasks));
  const [actionError, setActionError] = useState('');
  const externalErrorMessage = typeof externalError === 'string'
    ? externalError
    : externalError instanceof Error
      ? externalError.message
      : externalError
        ? 'Wedding tasks could not be loaded.'
        : '';

  useEffect(() => {
    if (Array.isArray(suppliedTasks)) setTaskList(normalizeTasks(suppliedTasks));
  }, [suppliedTasks]);

  useEffect(() => {
    if (Array.isArray(suppliedTasks)) {
      setIsLoadingTasks(false);
      return undefined;
    }

    let isMounted = true;
    setIsLoadingTasks(true);
    opsApi.getTasks(1, INITIAL_TASKS)
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const normalizedTasks = normalizeTasks(data);
          if (normalizedTasks.length > 0) {
            setTaskList(normalizedTasks);
          } else {
            setActionError('The tasks service returned no valid task records. The seeded plan remains available.');
          }
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setActionError(getErrorMessage(loadError, 'Could not load wedding tasks.'));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingTasks(false);
      });

    return () => {
      isMounted = false;
    };
  }, [suppliedTasks]);

  const completedCount = taskList.filter((task) => task.stage === 'DONE').length;
  const inProgressCount = taskList.filter((task) => task.stage === 'IN_PROGRESS').length;
  const toPlanCount = taskList.filter((task) => task.stage === 'TO_PLAN').length;
  const progressPercent = taskList.length ? Math.round((completedCount / taskList.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();

    return taskList.filter((task) => {
      const matchesCategory = selectedCategory === 'ALL' || task.category === selectedCategory;
      const matchesSearch = !query
        || task.title.toLocaleLowerCase().includes(query)
        || task.owner_name.toLocaleLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [taskList, selectedCategory, searchQuery]);

  const advanceTaskStage = async (task) => {
    const stageIndex = STAGES.findIndex((stage) => stage.key === task.stage);
    const nextStage = STAGES[stageIndex + 1];
    if (!nextStage || pendingTaskIds.has(task.task_id)) return;

    setActionError('');
    setPendingTaskIds((current) => new Set(current).add(task.task_id));
    setTaskList((current) => current.map((item) => (
      item.task_id === task.task_id ? { ...item, stage: nextStage.key } : item
    )));

    try {
      if (onTaskStageChange) {
        await onTaskStageChange(task.task_id, nextStage.key);
      } else {
        await opsApi.updateTaskStage(task.task_id, nextStage.key);
      }
    } catch (stageError) {
      setTaskList((current) => current.map((item) => (
        item.task_id === task.task_id ? { ...item, stage: task.stage } : item
      )));
      setActionError(getErrorMessage(stageError, 'Could not update this task. Its previous stage has been restored.'));
    } finally {
      setPendingTaskIds((current) => {
        const next = new Set(current);
        next.delete(task.task_id);
        return next;
      });
    }
  };

  const generatePlan = async () => {
    if (isGenerating) return;

    const previousTasks = taskList;
    setIsGenerating(true);
    setActionError('');

    try {
      const result = await onGeneratePlan?.(INITIAL_TASKS.map((task) => ({ ...task })));
      setTaskList(Array.isArray(result) ? normalizeTasks(result) : INITIAL_TASKS.map((task) => ({ ...task })));
    } catch (generationError) {
      setTaskList(previousTasks);
      setActionError(getErrorMessage(generationError, 'Could not generate the plan. Your existing tasks have been preserved.'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section aria-labelledby="task-kanban-title" className="min-h-screen space-y-6 bg-[#FFFDF9] p-4 text-[#2A211D] sm:p-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[#ECE7E1] pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-[#8C827A]">THE ROYAL KNOT WORKSPACE</p>
          <h1 id="task-kanban-title" className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#2A211D]">The Instant Wedding Plan</h1>
          <p className="mt-1 text-sm text-[#7A7067]">A live view of the 28 operational tasks for your celebration.</p>
        </div>
        <button
          type="button"
          onClick={generatePlan}
          disabled={loading || isLoadingTasks || isGenerating}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#722F37] px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#5B1F27] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles size={17} className="text-[#F3E5AB]" aria-hidden="true" />
          {isGenerating ? 'Generating plan…' : 'Generate 28-Task Plan'}
        </button>
      </header>

      {(externalErrorMessage || actionError) && (
        <p role="alert" className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {actionError || externalErrorMessage}
        </p>
      )}

      <section aria-label="Plan progress" className="rounded-xl border border-[#ECE7E1]/80 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover:[translate:0_-2px] hover:shadow-md">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-600">Total tasks</p>
            <p className="mt-1 text-2xl font-semibold text-[#D4AF37]">{taskList.length}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-amber-800">To plan</p>
            <p className="mt-1 text-2xl font-semibold text-amber-800">{toPlanCount}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-amber-800">In progress</p>
            <p className="mt-1 text-2xl font-semibold text-amber-800">{inProgressCount}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-700">Completed</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">{completedCount}</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-slate-600">Overall completion</span>
            <span aria-live="polite" className="font-semibold text-emerald-800">{progressPercent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Task plan completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            className="h-2.5 overflow-hidden rounded-full bg-slate-100"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#D4AF37]"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <span className="sr-only">Search tasks by title or owner</span>
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search task title or owner…"
            className="min-h-11 w-full rounded-xl border border-slate-700 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/25"
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-white px-3 focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/25 sm:w-64">
          <span className="sr-only">Filter tasks by category</span>
          <ListTodo size={17} className="shrink-0 text-[#D4AF37]" aria-hidden="true" />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="min-h-10 w-full bg-transparent text-sm text-slate-900 focus:outline-none"
          >
            <option value="ALL">All categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </label>
      </div>

      {(loading || isLoadingTasks) && <p role="status" className="text-sm text-slate-400">Loading wedding tasks…</p>}

      <div className="grid items-start gap-4 md:grid-cols-3">
        {STAGES.map(({ key, title, icon: Icon, dot, badge, count }) => {
          const columnTasks = filteredTasks.filter((task) => task.stage === key);
          const taskCount = taskList.filter((task) => task.stage === key).length;

          return (
            <section
              key={key}
              aria-labelledby={`task-column-${key}`}
              className="flex min-h-72 flex-col rounded-xl border border-[#ECE7E1]/80 bg-white/85 p-3 shadow-sm backdrop-blur-md transition-all duration-200 hover:[translate:0_-2px] hover:shadow-md sm:p-4"
            >
              <header className="mb-3 flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h2 id={`task-column-${key}`} className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
                  <Icon size={16} aria-hidden="true" />
                  {title}
                  <span className="sr-only">tasks</span>
                </h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${count}`} aria-label={`${taskCount} ${title} tasks`}>
                  {taskCount}
                </span>
              </header>

              <div className="flex flex-1 flex-col gap-3">
                <AnimatePresence initial={false}>
                  {columnTasks.map((task) => {
                    const stageIndex = STAGES.findIndex((stage) => stage.key === task.stage);
                    const nextStage = STAGES[stageIndex + 1];
                    const isPending = pendingTaskIds.has(task.task_id);
                    const ownerInitial = task.owner_name.trim().charAt(0).toLocaleUpperCase() || '?';

                    return (
                      <motion.div
                        key={task.task_id}
                        layout
                        layoutId={task.task_id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl border border-[#ECE7E1]/80 bg-white/85 p-3.5 shadow-sm backdrop-blur-md transition-all duration-200 hover:[translate:0_-2px] hover:border-[#D4AF37]/70 hover:shadow-md"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded-full border border-[#D4AF37]/30 bg-[#722F37]/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#F3E5AB]">
                            {task.category.replaceAll('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-400">
                            Due <time>{formatDueDate(task.due_date)}</time>
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold leading-snug text-slate-900">{task.title}</h3>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-700 pt-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#722F37] text-xs font-semibold text-white"
                              aria-hidden="true"
                            >
                              {ownerInitial}
                            </span>
                            <span className="truncate text-xs font-medium text-slate-700" title={task.owner_name}>
                              {task.owner_name || 'Unassigned'}
                            </span>
                          </div>
                          {nextStage ? (
                            <button
                              type="button"
                              onClick={() => advanceTaskStage(task)}
                              disabled={isPending || loading || isLoadingTasks}
                              aria-label={`Move ${task.title} to ${nextStage.title}`}
                              className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#722F37] transition hover:bg-[#722F37]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] disabled:cursor-wait disabled:opacity-50"
                            >
                              {isPending ? 'Saving…' : nextStage.title}
                              <ArrowRight size={14} aria-hidden="true" />
                            </button>
                          ) : (
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${badge}`}>
                              Complete
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {columnTasks.length === 0 && (
                  <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 px-3 text-center text-sm text-slate-600">
                    <ListTodo size={20} className="mb-2 text-[#D4AF37]" aria-hidden="true" />
                    {taskList.length === 0
                      ? 'Generate a plan to add wedding tasks.'
                      : filteredTasks.length === 0
                        ? 'No tasks match your search or category.'
                        : 'No tasks in this stage.'}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

export default TaskKanban;
