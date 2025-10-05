const path = require('path');

// Load .env from the **CerebrasApp** folder (one level up from backend)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const fetch = require('node-fetch');

const CEREBRAS_ENDPOINT = 'https://api.cerebras.ai/v1/transactions/analyze'; // <-- adjust if needed

/**
 * Sends a list of transactions to the Cerebras API.
 * @param {Array<Object>} transactions - Normalised transaction objects.
 * @returns {Promise<Object>} - Parsed JSON response from Cerebras.
 */
async function sendToCerebras(transactions) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error('CEREBRAS_API_KEY is missing from .env');
  }

  const response = await fetch(CEREBRAS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ transactions })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cerebras API error ${response.status}: ${errText}`);
  }

  return response.json();
}

module.exports = { sendToCerebras };