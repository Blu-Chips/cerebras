const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const fetch = require('node-fetch');

// 👉 Default model – use gpt-oss-120b unless CEREBRAS_MODEL is set in .env
const MODEL_NAME = process.env.CEREBRAS_MODEL || 'gpt-oss-120b';

// ✅ Correct inference endpoint (OpenAI‑compatible)
const CEREBRAS_ENDPOINT = 'https://api.cerebras.ai/v1/completions';

/**
 * Sends a prompt (or chat messages) to the Cerebras inference API.
 * @param {Object} payload – must contain either `prompt` (string) or `messages` (array) **and** `model`.
 * @returns {Promise<Object>} – parsed JSON response from Cerebras.
 */
async function sendToCerebras(payload) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error('CEREBRAS_API_KEY is missing from .env');
  }

  // Ensure the model name is present in the payload
  const body = {
    model: MODEL_NAME,
    ...payload               // e.g. { prompt: "...", max_tokens: 200 }
  };

  console.log(`🔎 Sending request to model "${MODEL_NAME}"`);

  const response = await fetch(CEREBRAS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cerebras API error ${response.status}: ${errText}`);
  }

  return response.json();
}

module.exports = { sendToCerebras };