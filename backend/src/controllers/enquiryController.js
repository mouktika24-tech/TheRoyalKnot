const { pool } = require('../config/db');

async function createEnquiry(req, res, next) {
  let connection;
  let transactionStarted = false;

  try {
    connection = await pool.connect();
    await connection.query('BEGIN');
    transactionStarted = true;

    const {
      name,
      email,
      phone,
      couple_name: coupleName,
      city,
      destination_venue: destinationVenue,
      package_type: packageType,
      start_date: startDate,
      end_date: endDate,
      estimated_guests: estimatedGuests,
      max_budget: maxBudget,
    } = req.body;

    const clientResult = await connection.query(
      `INSERT INTO clients (name, email, phone)
       VALUES ($1, $2, $3)
       RETURNING client_id, name, email, phone, created_at`,
      [name, email, phone]
    );
    const client = clientResult.rows[0];

    const weddingResult = await connection.query(
      `INSERT INTO weddings (
         client_id, couple_name, city, destination_venue, package_type,
         start_date, end_date, estimated_guests, max_budget, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ENQUIRY')
       RETURNING wedding_id, client_id, couple_name, city, destination_venue,
                 package_type, start_date, end_date, estimated_guests,
                 max_budget, actual_cost, status, created_at`,
      [
        client.client_id,
        coupleName,
        city,
        destinationVenue,
        packageType,
        startDate,
        endDate,
        estimatedGuests,
        maxBudget,
      ]
    );

    await connection.query('COMMIT');
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      data: {
        client,
        wedding: weddingResult.rows[0],
      },
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Failed to roll back enquiry transaction:', rollbackError);
      }
    }

    return next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function listEnquiries(req, res, next) {
  const { status } = req.query;
  const values = [];
  let statusFilter = '';

  if (status) {
    values.push(status);
    statusFilter = 'WHERE w.status = $1';
  }

  try {
    const result = await pool.query(
      `SELECT c.client_id, c.name, c.email, c.phone,
              w.wedding_id, w.couple_name, w.city, w.destination_venue,
              w.package_type, w.start_date, w.end_date, w.estimated_guests,
              w.max_budget, w.actual_cost, w.status,
              w.created_at AS created_at
       FROM weddings w
       JOIN clients c ON c.client_id = w.client_id
       ${statusFilter}
       ORDER BY w.created_at DESC, w.wedding_id DESC`,
      values
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createEnquiry,
  listEnquiries,
};
