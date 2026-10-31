import { motion } from 'framer-motion';
import { IndianRupee, ReceiptText, X } from 'lucide-react';

const sampleExpenses = [
  { id: 1, description: 'Additional banquet guests', quantity: 60, unitRate: 2200, total: 132000 },
  { id: 2, description: 'Additional DJ hours', quantity: 2, unitRate: 15000, total: 30000 },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

function ExpenseReconcilerModal({
  isOpen = true,
  onClose,
  expenses = sampleExpenses,
  advancesPaid = 800000,
  loading = false,
  error = null,
}) {
  if (!isOpen) return null;

  const extrasTotal = expenses.reduce((sum, expense) => sum + expense.total, 0);
  const balanceDue = extrasTotal - advancesPaid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slateNavy/60 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}>
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-reconciler-title"
        className="my-auto w-full max-w-2xl rounded-2xl border border-champagneGold/40 bg-creamIvory shadow-2xl"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-champagneGold/30 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-champagneGoldLight p-3 text-royalMaroon" aria-hidden="true">
              <ReceiptText size={22} />
            </span>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-royalMaroon">Post-wedding settlement</p>
              <h2 id="expense-reconciler-title" className="text-xl font-semibold text-slateNavy">Expense Reconciliation</h2>
            </div>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close expense reconciliation" className="rounded-lg p-2 text-slateNavy/60 hover:bg-slateLight hover:text-slateNavy focus-visible:outline focus-visible:outline-2 focus-visible:outline-royalMaroon">
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          {error && (
            <p role="alert" className="rounded-xl border border-rubyDanger/30 bg-rubyDanger/10 px-4 py-3 text-sm text-rubyDanger">
              {error}
            </p>
          )}
          {loading ? (
            <p role="status" className="py-8 text-center text-sm text-slateNavy/60">Loading reconciliation…</p>
          ) : (
            <>
              {expenses.length === 0 ? (
                <p className="rounded-xl border border-champagneGold/30 bg-white px-4 py-8 text-center text-sm text-slateNavy/60">
                  No additional expenses to reconcile.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-champagneGold/30 bg-white">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <caption className="sr-only">Additional wedding expenses</caption>
                    <thead className="bg-slateLight text-xs uppercase tracking-wide text-slateNavy/65">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-semibold">Expense</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Units</th>
                        <th scope="col" className="px-4 py-3 font-semibold">Unit rate</th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-champagneGold/20">
                      {expenses.map((expense) => (
                        <tr key={expense.id}>
                          <th scope="row" className="px-4 py-3 font-medium text-slateNavy">{expense.description}</th>
                          <td className="px-4 py-3 text-slateNavy/75">{expense.quantity}</td>
                          <td className="px-4 py-3 text-slateNavy/75">{formatCurrency(expense.unitRate)}</td>
                          <td className="px-4 py-3 text-right font-medium text-slateNavy">{formatCurrency(expense.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <dl className="space-y-3 rounded-xl bg-white p-4">
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-slateNavy/70">Additional expenses</dt>
                  <dd className="font-medium text-slateNavy">{formatCurrency(extrasTotal)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-slateNavy/70">Advances paid</dt>
                  <dd className="font-medium text-slateNavy">−{formatCurrency(advancesPaid)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-champagneGold/30 pt-3">
                  <dt className="font-semibold text-slateNavy">Net balance</dt>
                  <dd className={`flex items-center font-semibold ${balanceDue > 0 ? 'text-royalMaroon' : 'text-emeraldSuccess'}`}>
                    <IndianRupee size={16} aria-hidden="true" />
                    {formatCurrency(Math.abs(balanceDue)).replace(/^₹/, '')}
                    <span className="ml-1 text-xs font-medium">{balanceDue > 0 ? 'due' : 'credit'}</span>
                  </dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </motion.section>
    </div>
  );
}

export default ExpenseReconcilerModal;
