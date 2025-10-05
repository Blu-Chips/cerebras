const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const fetch = require('node-fetch');

// Model to use – set CEREBRAS_MODEL in .env or fall back to llama2-70b
const MODEL_NAME = process.env.CEREBRAS_MODEL || 'llama2-70b';

// Construct the correct inference endpoint
const CEREBRAS_ENDPOINT = `https://api.cerebras.ai/v1/models/${MODEL_NAME}/predict`;

/**
 * Sends a prompt (or chat messages) to the Cerebras inference API.
 * @param {Object} payload – must contain either `prompt` (string) or `messages` (array).
 * @returns {Promise<Object>} – parsed JSON response from Cerebras.
 */
async function sendToCerebras(payload) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error('CEREBRAS_API_KEY is missing from .env');
  }

  console.log(`🔎 Sending request to model "${MODEL_NAME}"`);

  const response = await fetch(CEREBRAS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cerebras API error ${response.status}: ${errText}`);
  }

  return response.json();
}

module.exports = { sendToCerebras };