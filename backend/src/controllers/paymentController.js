const { pool } = require('../config/db');

const PAYMENT_STAGES = [
  { stageType: 'BOOKING_DEPOSIT', percent: 20 },
  { stageType: 'ADVANCE_1MONTH', percent: 50 },
  { stageType: 'FINAL_BALANCE', percent: 30 },
];

function createHttpError(statusCode, message, details = []) {
  return Object.assign(new Error(message), { statusCode, details });
}

function amountToCents(amount) {
  const match = /^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(String(amount).trim());
  if (!match) {
    throw new TypeError('Agreed amount must be a positive monetary value with at most two decimal places');
  }

  const cents = BigInt(match[1]) * 100n + BigInt((match[2] || '').padEnd(2, '0') || '0');
  if (cents <= 0n) {
    throw new RangeError('Agreed amount must be positive');
  }

  return cents;
}

function centsToAmount(cents) {
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}

function calculateMilestoneAmounts(totalAmount) {
  const totalCents = amountToCents(totalAmount);
  const depositCents = (totalCents * 20n + 50n) / 100n;
  const advanceCents = (totalCents * 50n + 50n) / 100n;
  const finalCents = totalCents - depositCents - advanceCents;

  if (depositCents < 1n || advanceCents < 1n || finalCents < 1n) {
    throw new RangeError('Agreed amount is too small to create three positive milestones');
  }

  return [depositCents, advanceCents, finalCents].map(centsToAmount);
}

function shiftDate(isoDate, days) {
  if (typeof isoDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new TypeError('Wedding dates must be valid ISO calendar dates');
  }

  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== isoDate ||
    !Number.isInteger(days)
  ) {
    throw new TypeError('Wedding dates must be valid ISO calendar dates');
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getAgreedWeddingAmount() {
  // The current schema has no approved client-price field; max_budget and actual_cost are not substitutes.
  return null;
}

async function insertPaymentMilestones(connection, wedding, agreedAmount) {
  const amounts = calculateMilestoneAmounts(agreedAmount);
  const dueDates = [
    wedding.today,
    shiftDate(wedding.start_date, -30),
    shiftDate(wedding.end_date, 3),
  ];
  const payments = [];

  for (let index = 0; index < PAYMENT_STAGES.length; index += 1) {
    const { stageType } = PAYMENT_STAGES[index];
    const result = await connection.query(
      `INSERT INTO payments (wedding_id, stage_type, amount, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING payment_id, wedding_id, stage_type, amount, due_date,
                 paid_date, status, payment_method`,
      [wedding.wedding_id, stageType, amounts[index], dueDates[index]]
    );
    payments.push(result.rows[0]);
  }

  return payments;
}

function createPaymentPlanHandler(resolveAgreedAmount = getAgreedWeddingAmount) {
  return async function createPaymentPlan(req, res, next) {
    let connection;
    let transactionStarted = false;

    try {
      connection = await pool.connect();
      await connection.query('BEGIN');
      transactionStarted = true;

      const weddingResult = await connection.query(
        `SELECT wedding_id,
                to_char(start_date, 'YYYY-MM-DD') AS start_date,
                to_char(end_date, 'YYYY-MM-DD') AS end_date,
                to_char(CURRENT_DATE, 'YYYY-MM-DD') AS today
         FROM weddings
         WHERE wedding_id = $1
         FOR UPDATE`,
        [req.params.weddingId]
      );

      if (weddingResult.rowCount === 0) {
        throw createHttpError(404, 'Wedding not found');
      }

      const wedding = weddingResult.rows[0];
      const existingPayments = await connection.query(
        `SELECT payment_id, stage_type
         FROM payments
         WHERE wedding_id = $1
         FOR UPDATE`,
        [wedding.wedding_id]
      );

      if (existingPayments.rowCount > 0) {
        throw createHttpError(
          409,
          'A payment plan already exists or contains partial milestones for this wedding'
        );
      }

      const agreedAmount = await resolveAgreedAmount(wedding);
      if (agreedAmount === null) {
        throw createHttpError(
          409,
          'Payment plan cannot be generated: no agreed wedding amount is defined. Establish and persist the approved client price before creating payment milestones.'
        );
      }

      const payments = await insertPaymentMilestones(connection, wedding, agreedAmount);

      await connection.query('COMMIT');
      transactionStarted = false;

      return res.status(201).json({
        success: true,
        data: { payments },
      });
    } catch (error) {
      if (connection && transactionStarted) {
        try {
          await connection.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Failed to roll back payment-plan transaction:', rollbackError);
        }
      }

      return next(error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };
}

const createPaymentPlan = createPaymentPlanHandler();

async function recordPayment(req, res, next) {
  let connection;
  let transactionStarted = false;

  try {
    connection = await pool.connect();
    await connection.query('BEGIN');
    transactionStarted = true;

    const paymentResult = await connection.query(
      `SELECT payment_id, status
       FROM payments
       WHERE payment_id = $1
       FOR UPDATE`,
      [req.params.paymentId]
    );

    if (paymentResult.rowCount === 0) {
      throw createHttpError(404, 'Payment not found');
    }

    if (paymentResult.rows[0].status === 'PAID') {
      throw createHttpError(409, 'Payment has already been recorded as paid');
    }

    if (!['DUE', 'OVERDUE'].includes(paymentResult.rows[0].status)) {
      throw createHttpError(409, 'Payment cannot be recorded from its current status');
    }

    const updateResult = await connection.query(
      `UPDATE payments
       SET status = 'PAID',
           paid_date = CURRENT_DATE,
           payment_method = COALESCE($2, payment_method)
       WHERE payment_id = $1
       RETURNING payment_id, wedding_id, stage_type, amount, due_date,
                 paid_date, status, payment_method`,
      [req.params.paymentId, (req.body && req.body.payment_method) || null]
    );

    await connection.query('COMMIT');
    transactionStarted = false;

    return res.status(200).json({
      success: true,
      data: { payment: updateResult.rows[0] },
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Failed to roll back payment-recording transaction:', rollbackError);
      }
    }

    return next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  createPaymentPlan,
  createPaymentPlanHandler,
  recordPayment,
  calculateMilestoneAmounts,
  shiftDate,
  insertPaymentMilestones,
};
