const { sendToCerebras } = require('./cerebrasService');

// Mock node-fetch
require('jest-fetch-mock').enableMocks();

describe('cerebrasService', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('should call Cerebras API and return parsed JSON', async () => {
    const mockResponse = {
      id: 'test-id',
      choices: [{ text: 'This is a test summary.' }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
    };

    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await sendToCerebras({
      prompt: 'Summarize: Cash Out -300 KES, Send Money 2000 KES',
      max_tokens: 100
    });

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.cerebras.ai/v1/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
        },
        body: expect.any(String)
      })
    );
  });

  test('should throw error if API returns non-2xx status', async () => {
    fetch.mockResponseOnce('Invalid request', { status: 400 });

    await expect(
      sendToCerebras({ prompt: 'bad prompt' })
    ).rejects.toThrow('Cerebras API error 400: Invalid request');
  });
});