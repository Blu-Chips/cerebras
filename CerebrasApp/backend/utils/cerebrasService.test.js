const { sendToCerebras } = require('./cerebrasService');

// Mock node-fetch at the global level
global.fetch = jest.fn();

describe('cerebrasService', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should call Cerebras API and return parsed JSON', async () => {
    const mockResponse = {
      id: 'test-id',
      choices: [{ text: 'This is a test summary.' }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
    };

    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const result = await sendToCerebras({
      prompt: 'Summarize: Cash Out -300 KES, Send Money 2000 KES',
      max_tokens: 100
    });

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('should throw error if API returns non-2xx status', async () => {
    fetch.mockResolvedValue({
      ok: false,
      text: async () => 'Invalid request',
      status: 400
    });

    await expect(
      sendToCerebras({ prompt: 'bad prompt' })
    ).rejects.toThrow('Cerebras API error 400: Invalid request');
  });
});