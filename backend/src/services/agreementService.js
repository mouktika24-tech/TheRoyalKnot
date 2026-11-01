require('dotenv').config();

const { pool } = require('../config/db');

const MAX_POSTGRES_INT = 2147483647;

const CONTRACT_TERMS = `This document records the wedding information currently available in The Royal Knot system at the time of generation. It is intended to provide a factual record of the information stored in the system and does not create, modify, or imply any additional contractual obligations, payment commitments, or legal terms between the parties.

Any additional contractual terms or obligations must be separately reviewed and expressly approved by the relevant parties.`;

const WEDDING_DETAILS_QUERY = `SELECT
  wedding_id,
  couple_name,
  city,
  destination_venue,
  package_type,
  start_date,
  end_date,
  estimated_guests,
  max_budget
FROM weddings
WHERE wedding_id = $1`;

const AGREEMENTS_QUERY = `SELECT
  agreement_id,
  wedding_id,
  contract_terms,
  signed_by_name,
  signature_data,
  signed_at,
  status
FROM agreements
WHERE wedding_id = $1
LIMIT 2`;

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertWeddingId(weddingId) {
  if (!Number.isSafeInteger(weddingId) || weddingId < 1 || weddingId > MAX_POSTGRES_INT) {
    throw createHttpError(400, 'weddingId must be a positive PostgreSQL integer');
  }
}

function assertAgreementId(agreementId) {
  if (
    !Number.isSafeInteger(agreementId)
    || agreementId < 1
    || agreementId > MAX_POSTGRES_INT
  ) {
    throw createHttpError(400, 'agreementId must be a positive PostgreSQL integer');
  }
}

function logMultipleAgreements(weddingId) {
  console.error('Data integrity issue: multiple agreements found for wedding', { weddingId });
}

async function generateAgreement(weddingId, database = pool) {
  assertWeddingId(weddingId);

  const client = await database.connect();
  try {
    await client.query('BEGIN');

    const wedding = await client.query(
      'SELECT wedding_id FROM weddings WHERE wedding_id = $1 FOR UPDATE',
      [weddingId]
    );
    if (wedding.rowCount === 0) {
      throw createHttpError(404, 'Wedding not found');
    }

    const agreements = await client.query(AGREEMENTS_QUERY, [weddingId]);
    if (agreements.rowCount > 1) {
      logMultipleAgreements(weddingId);
      throw createHttpError(409, 'Multiple agreements found for this wedding');
    }

    if (agreements.rowCount === 1) {
      await client.query('COMMIT');
      return { agreement: agreements.rows[0], created: false };
    }

    const createdAgreement = await client.query(
      `INSERT INTO agreements (wedding_id, contract_terms, status)
       VALUES ($1, $2, 'PENDING')
       RETURNING agreement_id, wedding_id, contract_terms, signed_by_name,
                 signature_data, signed_at, status`,
      [weddingId, CONTRACT_TERMS]
    );

    await client.query('COMMIT');
    return { agreement: createdAgreement.rows[0], created: true };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Failed to roll back agreement generation transaction:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function getAgreement(weddingId, database = pool) {
  assertWeddingId(weddingId);

  const weddingResult = await database.query(WEDDING_DETAILS_QUERY, [weddingId]);
  if (weddingResult.rowCount === 0) {
    throw createHttpError(404, 'Wedding not found');
  }

  const agreementResult = await database.query(AGREEMENTS_QUERY, [weddingId]);
  if (agreementResult.rowCount === 0) {
    throw createHttpError(404, 'Agreement not found');
  }
  if (agreementResult.rowCount > 1) {
    logMultipleAgreements(weddingId);
    throw createHttpError(409, 'Multiple agreements found for this wedding');
  }

  return {
    agreement: agreementResult.rows[0],
    wedding: {
      ...weddingResult.rows[0],
      max_budget_label: 'Recorded Maximum Budget'
    }
  };
}

async function signAgreement(agreementId, { signer_name: signerName, signature_data: signatureData }, database = pool) {
  assertAgreementId(agreementId);
  const normalizedSignerName = signerName.trim();

  const client = await database.connect();
  try {
    await client.query('BEGIN');

    const agreementResult = await client.query(
      `SELECT agreement_id, wedding_id, contract_terms, signed_by_name,
              signature_data, signed_at, status
       FROM agreements
       WHERE agreement_id = $1
       FOR UPDATE`,
      [agreementId]
    );
    if (agreementResult.rowCount === 0) {
      throw createHttpError(404, 'Agreement not found');
    }

    const currentAgreement = agreementResult.rows[0];
    if (currentAgreement.status === 'SIGNED') {
      throw createHttpError(409, 'Agreement has already been signed');
    }
    if (currentAgreement.status === 'REJECTED') {
      throw createHttpError(409, 'Rejected agreements cannot be signed');
    }
    if (currentAgreement.status !== 'PENDING') {
      throw createHttpError(409, 'Agreement is not available for signing');
    }
    if (currentAgreement.wedding_id === null) {
      throw createHttpError(409, 'Agreement is not associated with a wedding');
    }
    if (
      currentAgreement.signed_by_name !== null
      || currentAgreement.signature_data !== null
      || currentAgreement.signed_at !== null
    ) {
      throw createHttpError(409, 'Agreement already contains signature details');
    }

    const weddingResult = await client.query(
      'SELECT wedding_id FROM weddings WHERE wedding_id = $1 FOR UPDATE',
      [currentAgreement.wedding_id]
    );
    if (weddingResult.rowCount === 0) {
      throw createHttpError(409, 'Agreement references a wedding that does not exist');
    }

    const signedAgreement = await client.query(
      `UPDATE agreements
       SET status = 'SIGNED',
           signed_by_name = $2,
           signature_data = $3,
           signed_at = NOW()
       WHERE agreement_id = $1
         AND status = 'PENDING'
         AND signed_by_name IS NULL
         AND signature_data IS NULL
         AND signed_at IS NULL
       RETURNING agreement_id, wedding_id, contract_terms, signed_by_name,
                 signature_data, signed_at, status`,
      [agreementId, normalizedSignerName, signatureData]
    );
    if (signedAgreement.rowCount !== 1) {
      throw createHttpError(409, 'Agreement is no longer available for signing');
    }

    const confirmedWedding = await client.query(
      `UPDATE weddings
       SET status = 'CONFIRMED'
       WHERE wedding_id = $1
       RETURNING wedding_id`,
      [currentAgreement.wedding_id]
    );
    if (confirmedWedding.rowCount !== 1) {
      throw createHttpError(409, 'Agreement references a wedding that does not exist');
    }

    await client.query('COMMIT');
    return signedAgreement.rows[0];
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Failed to roll back agreement signing transaction:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  CONTRACT_TERMS,
  generateAgreement,
  getAgreement,
  signAgreement
};

