const request = require('supertest');
const app = require('./server');

// Mock sendToCerebras to avoid real API calls
jest.mock('./utils/cerebrasService', () => ({
  sendToCerebras: jest.fn()
}));

const { sendToCerebras } = require('./utils/cerebrasService');

describe('POST /api/cerebras', () => {
  test('should return summary when given transactions', async () => {
    const mockTransactions = [
      { description: 'Cash Out', amount: -300, currency: 'KES' },
      { description: 'Send Money', amount: 2000, currency: 'KES' }
    ];

    sendToCerebras.mockResolvedValue({
      id: 'test-id',
      choices: [{ text: 'Summary: Cash Out -300 KES, Send Money +2000 KES' }],
      usage: { prompt_tokens: 10, completion_tokens: 25, total_tokens: 35 }
    });

    const res = await request(app)
      .post('/api/cerebras')
      .send({ transactions: mockTransactions })
      .set('Content-Type', 'application/json')
      .expect(200);

    expect(res.body.message).toBe('Cerebras API call successful');
    expect(res.body.result.choices[0].text).toContain('Summary');
  });

  test('should return summary when given raw prompt', async () => {
    sendToCerebras.mockResolvedValue({
      id: 'test-id',
      choices: [{ text: 'This is a custom summary.' }],
      usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 }
    });

    const res = await request(app)
      .post('/api/cerebras')
      .send({ prompt: 'Summarize these transactions' })
      .set('Content-Type', 'application/json')
      .expect(200);

    expect(res.body.result.choices[0].text).toBe('This is a custom summary.');
  });

  test('should return 400 if no prompt or transactions', async () => {
    const res = await request(app)
      .post('/api/cerebras')
      .send({})
      .set('Content-Type', 'application/json')
      .expect(400);

    expect(res.body.error).toBe('No prompt or transactions provided');
  });
});