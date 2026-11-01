require('dotenv').config();

const { pool } = require('../config/db');

const MAX_POSTGRES_INT = 2147483647;

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertWeddingId(weddingId) {
  if (
    !Number.isSafeInteger(weddingId)
    || weddingId < 1
    || weddingId > MAX_POSTGRES_INT
  ) {
    throw createHttpError(400, 'weddingId must be a positive PostgreSQL integer');
  }
}

async function getWeddingBillingReconciliation(weddingId, database = pool) {
  assertWeddingId(weddingId);

  const result = await database.query(
    `WITH wedding_data AS (
       SELECT wedding_id, max_budget
       FROM weddings
       WHERE wedding_id = $1
     ),
     accepted_quote_totals AS (
       SELECT wedding_id, SUM(total_amount) AS accepted_vendor_quote_total
       FROM vendor_quotes
       WHERE wedding_id = $1 AND status = 'ACCEPTED'
       GROUP BY wedding_id
     ),
     expense_totals AS (
       SELECT
         wedding_id,
         SUM(total_amount) AS total_extra_expenses,
         SUM(total_amount) FILTER (WHERE billed_to_client IS TRUE) AS client_billed_expenses,
         SUM(total_amount) FILTER (WHERE billed_to_client IS FALSE) AS business_expenses,
         SUM(total_amount) FILTER (WHERE billed_to_client IS NULL) AS unclassified_expenses
       FROM extra_expenses
       WHERE wedding_id = $1
       GROUP BY wedding_id
     ),
     paid_payment_totals AS (
       SELECT wedding_id, SUM(amount) AS total_payments_received
       FROM payments
       WHERE wedding_id = $1 AND status = 'PAID'
       GROUP BY wedding_id
     ),
     committed_totals AS (
       SELECT
         wd.wedding_id,
         wd.max_budget,
         COALESCE(aqt.accepted_vendor_quote_total, 0::numeric) AS accepted_vendor_quote_total,
         COALESCE(et.total_extra_expenses, 0::numeric) AS total_extra_expenses,
         COALESCE(et.client_billed_expenses, 0::numeric) AS client_billed_expenses,
         COALESCE(et.business_expenses, 0::numeric) AS business_expenses,
         COALESCE(et.unclassified_expenses, 0::numeric) AS unclassified_expenses,
         COALESCE(ppt.total_payments_received, 0::numeric) AS total_payments_received
       FROM wedding_data wd
       LEFT JOIN accepted_quote_totals aqt ON aqt.wedding_id = wd.wedding_id
       LEFT JOIN expense_totals et ON et.wedding_id = wd.wedding_id
       LEFT JOIN paid_payment_totals ppt ON ppt.wedding_id = wd.wedding_id
     )
     SELECT
       wedding_id,
       max_budget,
       accepted_vendor_quote_total,
       total_extra_expenses,
       client_billed_expenses,
       business_expenses,
       unclassified_expenses,
       accepted_vendor_quote_total + total_extra_expenses AS total_committed_costs,
       max_budget - (accepted_vendor_quote_total + total_extra_expenses) AS remaining_budget,
       total_payments_received
     FROM committed_totals`,
    [weddingId]
  );

  if (result.rowCount === 0) {
    throw createHttpError(404, 'Wedding not found');
  }

  return {
    ...result.rows[0],
    total_client_charges: null,
    client_balance: null,
    vendor_payouts: null,
    unresolved_metrics: {
      total_client_charges:
        'Unavailable until the agreed package amount is stored in an approved field; max_budget is not the agreed client charge.',
      client_balance:
        'Unavailable until the agreed package amount is stored in an approved field.',
      vendor_payouts:
        'Unavailable because the schema does not define a vendor payout mechanism.'
    }
  };
}

module.exports = { getWeddingBillingReconciliation };
