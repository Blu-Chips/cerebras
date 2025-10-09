# Cerebras MPESA Transaction Analyzer

This backend service extracts transaction data from PDF Bank statements and summarizes them using the **Cerebras `qwen-3-coder-480b`** model.

---

## 📦 Setup

1. Create a `.env` file in the project root with:

```env
CEREBRAS_API_KEY=your_api_key_here
```

2. Install dependencies:

```bash
npm install
```

---

## ▶️ Run the server

```bash
node server.js
```

Server will start on `http://127.0.0.1:5000`.

---

## 🧪 Run tests

```bash
npx jest
```

---

## 🧪 Example `curl` commands

### Upload and analyze Bank PDF

```bash
curl -X POST http://127.0.0.1:5000/api/analyze \
  -F "file=@path/to/bankstatement.pdf" \
  -H "Content-Type: multipart/form-data"
```

### Send transactions to Cerebras for summary

```bash
curl -X POST http://127.0.0.1:5000/api/cerebras \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {"description": "Cash Out", "amount": -300, "currency": "KES"},
      {"description": "Send Money", "amount": 2000, "currency": "KES"}
    ]
  }'
```

### Send custom prompt to Cerebras

```bash
curl -X POST http://127.0.0.1:5000/api/cerebras \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Summarize these transactions..."
  }'
```