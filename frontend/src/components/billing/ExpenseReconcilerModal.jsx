import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  Plus,
  Receipt,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const ORIGINAL_QUOTE = '4200000.00';

const INITIAL_EXTRAS = [
  {
    id: 1,
    vendor_id: 1,
    vendor_name: 'Royal Rajputana Caterers',
    category: 'CATERER',
    description: '60 additional dinner guests above the contracted count',
    extra_units: 60,
    unit_rate: '2200.00',
    total_amount: '132000.00',
    billed_to_client: true,
    logged_at: '22:15',
  },
  {
    id: 2,
    vendor_id: 2,
    vendor_name: 'Mewari Royal Sound & DJ Console',
    category: 'DJ_SOUND',
    description: '3 hours extended sound curfew',
    extra_units: 3,
    unit_rate: '15000.00',
    total_amount: '45000.00',
    billed_to_client: true,
    logged_at: '23:45',
  },
  {
    id: 3,
    vendor_id: 8,
    vendor_name: 'Palace Logistics & Generator Services',
    category: 'LOGISTICS',
    description: '250L palace generator diesel backup',
    extra_units: 250,
    unit_rate: '95.00',
    total_amount: '23750.00',
    billed_to_client: false,
    logged_at: '19:30',
  },
];

const VENDOR_OPTIONS = [
  { id: 1, name: 'Royal Rajputana Caterers', category: 'CATERER', label: 'Catering' },
  { id: 2, name: 'Mewari Royal Sound & DJ Console', category: 'DJ_SOUND', label: 'DJ / Sound' },
  { id: 3, name: 'Jaipur Floral Mandap Decorators', category: 'FLORIST', label: 'Florist' },
  { id: 8, name: 'Palace Logistics & Generator Services', category: 'LOGISTICS', label: 'Logistics' },
];

const CATEGORY_CLASSES = {
  CATERER: 'border-amber-200 bg-amber-50 text-amber-800',
  DJ_SOUND: 'border-violet-200 bg-violet-50 text-violet-800',
  LOGISTICS: 'border-blue-200 bg-blue-50 text-blue-800',
  FLORIST: 'border-pink-200 bg-pink-50 text-pink-800',
};

function toDecimalString(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d+)(?:\.(\d{0,2}))?$/);
    if (!match) return null;
    return `${match[1]}.${(match[2] ?? '').padEnd(2, '0')}`;
  }

  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value.toFixed(2);
  }

  return null;
}

function decimalToCents(value) {
  const decimal = toDecimalString(value);
  if (decimal === null) return null;
  const [whole, fraction] = decimal.split('.');
  return BigInt(whole) * 100n + BigInt(fraction);
}

function centsToDecimal(cents) {
  const whole = cents / 100n;
  const fraction = String(cents % 100n).padStart(2, '0');
  return `${whole}.${fraction}`;
}

function formatCentsAsCurrency(cents) {
  return formatCurrency(centsToDecimal(cents));
}

function normalizeExpense(expense, index) {
  if (!expense || typeof expense !== 'object') return null;

  const unitRate = toDecimalString(expense.unit_rate ?? expense.unitRate);
  const totalAmount = toDecimalString(expense.total_amount ?? expense.totalAmount);
  const units = Number(expense.extra_units ?? expense.units ?? expense.quantity);
  const description = typeof expense.description === 'string' ? expense.description.trim() : '';

  if (
    unitRate === null
    || totalAmount === null
    || !Number.isSafeInteger(units)
    || units < 1
    || !description
  ) return null;

  return {
    id: expense.id ?? `expense-${index}`,
    vendor_id: expense.vendor_id ?? expense.vendorId ?? null,
    vendor_name: typeof expense.vendor_name === 'string'
      ? expense.vendor_name
      : typeof expense.vendorName === 'string'
        ? expense.vendorName
        : 'Unassigned vendor',
    category: typeof expense.category === 'string' ? expense.category : 'OTHER',
    description,
    extra_units: units,
    unit_rate: unitRate,
    total_amount: totalAmount,
    billed_to_client: expense.billed_to_client ?? expense.billedToClient ?? true,
    logged_at: typeof expense.logged_at === 'string' ? expense.logged_at : '',
  };
}

function getErrorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function ExpenseReconcilerModal({
  isOpen = true,
  onClose,
  expenses: suppliedExpenses,
  loading = false,
  error: externalError = null,
  onAddExpense,
  onRemoveExpense,
  onFinalize,
}) {
  const [expenses, setExpenses] = useState(() => (
    (Array.isArray(suppliedExpenses) ? suppliedExpenses : INITIAL_EXTRAS)
      .map(normalizeExpense)
      .filter(Boolean)
  ));
  const [selectedVendorId, setSelectedVendorId] = useState(String(VENDOR_OPTIONS[0].id));
  const [description, setDescription] = useState('');
  const [units, setUnits] = useState('1');
  const [unitRate, setUnitRate] = useState('');
  const [billedToClient, setBilledToClient] = useState(true);
  const [isAudited, setIsAudited] = useState(false);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (Array.isArray(suppliedExpenses)) {
      setExpenses(suppliedExpenses.map(normalizeExpense).filter(Boolean));
    }
  }, [suppliedExpenses]);

  const parsedUnits = /^\d+$/.test(units) ? Number(units) : 0;
  const unitRateCents = decimalToCents(unitRate);
  const computedTotalCents = unitRateCents !== null && Number.isSafeInteger(parsedUnits)
    ? unitRateCents * BigInt(parsedUnits)
    : 0n;

  const totals = useMemo(() => {
    const incurred = expenses.reduce((sum, expense) => (
      sum + (decimalToCents(expense.total_amount) ?? 0n)
    ), 0n);
    const clientExtras = expenses.reduce((sum, expense) => (
      expense.billed_to_client
        ? sum + (decimalToCents(expense.total_amount) ?? 0n)
        : sum
    ), 0n);
    const originalQuoteCents = decimalToCents(ORIGINAL_QUOTE);

    return {
      incurred,
      clientExtras,
      agencyAbsorbed: incurred - clientExtras,
      finalTotal: (originalQuoteCents ?? 0n) + incurred,
      clientInvoice: (originalQuoteCents ?? 0n) + clientExtras,
    };
  }, [expenses]);

  const errorMessage = actionError || (
    typeof externalError === 'string'
      ? externalError
      : externalError instanceof Error
        ? externalError.message
        : externalError
          ? 'The reconciliation data could not be loaded.'
          : ''
  );

  const addExpense = async (event) => {
    event.preventDefault();
    setFormError('');
    setActionError('');
    setSuccessMessage('');

    const vendor = VENDOR_OPTIONS.find((option) => option.id === Number(selectedVendorId));
    const rateCents = decimalToCents(unitRate);
    if (!vendor) {
      setFormError('Choose a vendor for this expense.');
      return;
    }
    if (!description.trim()) {
      setFormError('Enter a description for this expense.');
      return;
    }
    if (!Number.isSafeInteger(parsedUnits) || parsedUnits < 1) {
      setFormError('Units must be a whole number greater than zero.');
      return;
    }
    if (rateCents === null || rateCents <= 0n) {
      setFormError('Enter a positive unit rate with up to two decimal places.');
      return;
    }

    const expense = {
      id: `expense-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      category: vendor.category,
      description: description.trim(),
      extra_units: parsedUnits,
      unit_rate: centsToDecimal(rateCents),
      total_amount: centsToDecimal(rateCents * BigInt(parsedUnits)),
      billed_to_client: billedToClient,
      logged_at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };

    setExpenses((current) => [expense, ...current]);
    setIsAudited(false);
    try {
      const savedExpense = await onAddExpense?.(expense);
      if (savedExpense && typeof savedExpense === 'object') {
        const normalizedSaved = normalizeExpense(savedExpense, expenses.length);
        if (normalizedSaved) {
          setExpenses((current) => current.map((item) => (
            item.id === expense.id ? normalizedSaved : item
          )));
        }
      }
      setDescription('');
      setUnits('1');
      setUnitRate('');
      setBilledToClient(true);
    } catch (saveError) {
      setExpenses((current) => current.filter((item) => item.id !== expense.id));
      setActionError(getErrorMessage(saveError, 'Could not add this expense. The ledger has been restored.'));
    }
  };

  const removeExpense = async (expense) => {
    if (pendingIds.has(expense.id)) return;
    setActionError('');
    setSuccessMessage('');
    setPendingIds((current) => new Set(current).add(expense.id));
    setExpenses((current) => current.filter((item) => item.id !== expense.id));
    setIsAudited(false);

    try {
      await onRemoveExpense?.(expense.id);
    } catch (removeError) {
      setExpenses((current) => [expense, ...current]);
      setActionError(getErrorMessage(removeError, 'Could not remove this expense. The ledger has been restored.'));
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(expense.id);
        return next;
      });
    }
  };

  const finalizeReconciliation = async () => {
    if (isFinalizing || loading) return;
    setIsFinalizing(true);
    setActionError('');
    setSuccessMessage('');

    try {
      await onFinalize?.({
        original_quote: ORIGINAL_QUOTE,
        extra_expenses: expenses.map((expense) => ({
          ...expense,
          unit_rate: String(expense.unit_rate),
          total_amount: String(expense.total_amount),
        })),
        extra_expenses_total: centsToDecimal(totals.incurred),
        client_payable_extras: centsToDecimal(totals.clientExtras),
        final_reconciled_total: centsToDecimal(totals.finalTotal),
        client_invoice_total: centsToDecimal(totals.clientInvoice),
      });
      setIsAudited(true);
      setSuccessMessage('Audit sealed successfully and ready for client invoicing.');
    } catch (finalizeError) {
      setIsAudited(false);
      setActionError(getErrorMessage(finalizeError, 'Could not finalize the reconciliation. Please try again.'));
    } finally {
      setIsFinalizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <section aria-labelledby="expense-reconciler-title" className="min-h-screen bg-[#FFFDF9] p-4 text-[#2A211D] sm:p-6">
      <header className="flex flex-col justify-between gap-4 border-b border-[#ECE7E1] pb-5 md:flex-row md:items-center">
        <div>
          <div>
            <p className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-[#8C827A]">THE ROYAL KNOT WORKSPACE</p>
            <span className="inline-flex rounded-full border border-[#722F37]/30 bg-[#722F37]/10 px-2.5 py-1 text-xs font-medium text-[#722F37]">Audit settlement</span>
          </div>
          <h1 id="expense-reconciler-title" className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#2A211D]">Billing &amp; Reconciliation</h1>
          <p className="mt-1 text-sm text-[#7A7067]">Reconcile on-site incidentals against the approved contract quote.</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="self-end rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#722F37] md:self-auto"
          >
            Close
          </button>
        )}
      </header>

      {(errorMessage || successMessage) && (
        <p
          role={errorMessage ? 'alert' : 'status'}
          aria-live={errorMessage ? 'assertive' : 'polite'}
          className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            errorMessage
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {errorMessage ? <AlertCircle size={17} aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}
          {errorMessage || successMessage}
        </p>
      )}

      <section aria-label="Reconciliation summary" className="my-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Original contract quote</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(ORIGINAL_QUOTE)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Baseline approved at booking</p>
        </article>
        <article className="rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-amber-800">Extra expenses incurred</p>
          <p className="mt-2 text-xl font-bold text-amber-700">{formatCentsAsCurrency(totals.incurred)}</p>
          <p className="mt-1 text-[11px] text-slate-500">{expenses.length} ledger {expenses.length === 1 ? 'entry' : 'entries'}</p>
        </article>
        <article className="rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Agency-absorbed expenses</p>
          <p className="mt-2 text-xl font-bold text-slate-700">{formatCentsAsCurrency(totals.agencyAbsorbed)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Not included in client invoice</p>
        </article>
        <article className="rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-emerald-800">Final reconciled total</p>
            {isAudited ? <CheckCircle2 size={17} className="text-emerald-600" aria-hidden="true" /> : <AlertCircle size={17} className="text-amber-600" aria-hidden="true" />}
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-700">{formatCentsAsCurrency(totals.finalTotal)}</p>
          <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
            isAudited
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-amber-300 bg-amber-50 text-amber-800'
          }`}>
            {isAudited ? 'RECONCILED' : 'PENDING_AUDIT'}
          </span>
        </article>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,2fr)]">
        <section className="h-fit rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Receipt size={17} className="text-[#722F37]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900">Log Extra Expense</h2>
          </div>

          <form onSubmit={addExpense} className="mt-4 space-y-3.5">
            {formError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {formError}
              </p>
            )}
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Vendor / category</span>
              <select
                value={selectedVendorId}
                onChange={(event) => setSelectedVendorId(event.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#722F37] focus:outline-none focus:ring-1 focus:ring-[#722F37] disabled:opacity-60"
              >
                {VENDOR_OPTIONS.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>{vendor.label} — {vendor.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Expense description</span>
              <input
                type="text"
                required
                maxLength={250}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. 60 surprise banquet guests"
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#722F37] focus:outline-none focus:ring-1 focus:ring-[#722F37] disabled:opacity-60"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Units</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={units}
                  onChange={(event) => setUnits(event.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-[#722F37] focus:outline-none focus:ring-1 focus:ring-[#722F37] disabled:opacity-60"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Unit rate (₹)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  inputMode="decimal"
                  value={unitRate}
                  onChange={(event) => setUnitRate(event.target.value)}
                  placeholder="2200.00"
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-[#722F37] focus:outline-none focus:ring-1 focus:ring-[#722F37] disabled:opacity-60"
                />
              </label>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
              <span className="text-slate-600">Calculated total</span>
              <output className="font-mono text-sm font-bold text-slate-900" aria-live="polite">
                {formatCentsAsCurrency(computedTotalCents)}
              </output>
            </div>

            <label className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={billedToClient}
                onChange={(event) => setBilledToClient(event.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-slate-300 text-[#722F37] focus:ring-[#722F37]"
              />
              <span className="text-xs font-medium text-slate-700">Billed to client</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#722F37] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#8B3A44] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={15} aria-hidden="true" />
              Add to audit ledger
            </button>
          </form>
        </section>

        <section aria-labelledby="expense-ledger-title" className="min-w-0 rounded-xl border border-[#ECE7E1] bg-white p-5 shadow-sm">
          <header className="flex flex-col justify-between gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center">
            <div>
              <h2 id="expense-ledger-title" className="text-sm font-bold text-slate-900">Itemized Extra Expenses</h2>
              <p className="text-xs text-slate-500">All unit rates and totals are maintained to two decimal places.</p>
            </div>
            <span className="w-fit rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}
            </span>
          </header>

          {loading ? (
            <p role="status" className="py-10 text-center text-sm text-slate-500">Loading expense ledger…</p>
          ) : expenses.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No extra expenses recorded. Add an expense to start the audit ledger.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[66rem] text-left text-xs">
                <caption className="sr-only">Itemized post-wedding extra expenses</caption>
                <thead className="border-y border-slate-200 bg-slate-50 font-semibold uppercase text-slate-600">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">Vendor</th>
                    <th scope="col" className="px-3 py-2.5">Category</th>
                    <th scope="col" className="px-3 py-2.5">Description</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Units</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Unit rate</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Total amount</th>
                    <th scope="col" className="px-3 py-2.5 text-center">Billed to client</th>
                    <th scope="col" className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <AnimatePresence initial={false}>
                    {expenses.map((expense) => (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="max-w-48 px-3 py-3">
                          <span className="block truncate font-medium text-slate-900" title={expense.vendor_name}>{expense.vendor_name}</span>
                          {expense.logged_at && <span className="mt-0.5 block text-[10px] text-slate-400">Logged {expense.logged_at}</span>}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_CLASSES[expense.category] || 'border-slate-200 bg-slate-100 text-slate-700'}`}>
                            {expense.category.replaceAll('_', ' ')}
                          </span>
                        </td>
                        <td className="max-w-64 px-3 py-3 text-slate-600">{expense.description}</td>
                        <td className="px-3 py-3 text-right font-mono">{expense.extra_units}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-mono">{formatCurrency(expense.unit_rate)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(expense.total_amount)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            expense.billed_to_client
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-slate-100 text-slate-600'
                          }`}>
                            {expense.billed_to_client ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeExpense(expense)}
                            disabled={loading || pendingIds.has(expense.id)}
                            aria-label={`Remove expense: ${expense.description}`}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#722F37] disabled:cursor-wait disabled:opacity-50"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          <footer className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Client invoice: <strong className="font-semibold text-slate-800">{formatCentsAsCurrency(totals.clientInvoice)}</strong>
              <span className="mx-1.5 text-slate-300">·</span>
              Agency absorbed: <strong className="font-semibold text-slate-800">{formatCentsAsCurrency(totals.agencyAbsorbed)}</strong>
            </p>
            <button
              type="button"
              onClick={finalizeReconciliation}
              disabled={loading || isFinalizing}
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-60 ${
                isAudited ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#722F37] hover:bg-[#8B3A44]'
              }`}
            >
              {isAudited ? <CheckCircle2 size={15} aria-hidden="true" /> : <FileCheck2 size={15} aria-hidden="true" />}
              {isFinalizing ? 'Finalizing…' : isAudited ? 'Audit sealed' : 'Finalize & Export Reconciliation'}
            </button>
          </footer>
        </section>
      </div>
    </section>
  );
}

export default ExpenseReconcilerModal;
