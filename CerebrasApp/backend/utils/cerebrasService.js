const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const fetch = require('node-fetch');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
// Default model – can be overridden by setting CEREBRAS_MODEL in .env
const MODEL_NAME = process.env.CEREBRAS_MODEL || 'gpt-oss-120b';

// Cerebras inference endpoint (OpenAI‑compatible)
const CEREBRAS_ENDPOINT = 'https://api.cerebras.ai/v1/completions';

// ---------------------------------------------------------------------------
// Public function – sends a prompt (or any payload) to Cerebras
// ---------------------------------------------------------------------------
/**
 * Calls the Cerebras completions endpoint.
 *
 * @param {Object} payload  Must contain at least a `prompt` string.
 *                         Additional OpenAI‑compatible fields (max_tokens,
 *                         temperature, …) are allowed.
 * @returns {Promise<Object>} Parsed JSON response from Cerebras.
 *
 * @throws {Error} If the API key is missing or the request fails.
 */
async function sendToCerebras(payload) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error('CEREBRAS_API_KEY is missing from .env');
  }

  // Ensure the model name is always present
  const body = {
    model: MODEL_NAME,
    ...payload,
  };

  console.log(`🔎 Sending request to model "${MODEL_NAME}"`);

  const response = await fetch(CEREBRAS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // The same key works for all Cerebras services (inference included)
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  // --------------------------------------------------------------
  // Error handling – surface the exact message Cerebras returns
  // --------------------------------------------------------------
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cerebras API error ${response.status}: ${errText}`);
  }

  // --------------------------------------------------------------
  // Success – return the parsed JSON
  // --------------------------------------------------------------
  return response.json();
}

// Export the helper for use in server.js
module.exports = { sendToCerebras };