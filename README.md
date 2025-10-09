
# Cerebras Bank Statement Analyzer (Monorepo)

This repository contains the full-stack SaaS web application for analyzing bank statements, now organized with all code at the root level. Users can upload PDF bank statements, convert them to Excel, and get AI-powered financial advice using Cerebras.ai and OpenRouter.

## Features

1. **PDF to Excel Conversion**: Upload any bank statement PDF and convert it to Excel format
2. **AI-Powered Transaction Categorization**: Automatically categorize transactions using LLMs
3. **Financial Advice Generation**: Get personalized savings advice based on spending patterns
4. **Interactive Data Visualization**: View transaction summaries with interactive charts
5. **User Account Management**: Secure user registration and authentication with Supabase
6. **Credit System**: Purchase credits for statement analysis through Stripe payments
7. **Multi-Model Support**: Choose from various AI models (Llama, Qwen) via OpenRouter

## Technology Stack

- **Backend**: Python with FastAPI
- **AI Services**: Cerebras.ai for ultra-fast inference, OpenRouter for model routing
- **Frontend**: React with Chart.js for data visualization
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Deployment**: Docker containerization


## Setup Instructions

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   cd frontend && npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory (see `DEPLOYMENT.md` for details) and add your API keys:
   - CEREBRAS_API_KEY
   - OPENROUTER_API_KEY
   - SUPABASE_URL, SUPABASE_KEY
   - STRIPE_SECRET_KEY

3. **Run with Docker**:
   ```bash
   docker-compose up
   ```

4. **Run Locally**:
   ```bash
   # Start backend
   python main.py

   # In another terminal, start frontend
   cd frontend && npm start
   ```


## API Endpoints

### User Management
- `POST /users/create` - Create new user account
- `POST /users/login` - Login to existing account
- `GET /users/credits/{user_id}` - Get user's credit balance

### Payments
- `POST /payments/create-intent` - Create Stripe payment intent
- `GET /payments/credit-packages` - Get available credit packages

### Statement Analysis
- `POST /upload-statement/` - Upload PDF bank statement
- `POST /convert-to-excel/` - Convert PDF to Excel format
- `POST /analyze-transactions/` - Analyze transactions with AI
- `GET /transaction-summary/` - Get transaction summary


## Credit System

- New users get 1 free credit
- $0.50 = 5 credits
- $2.00 = 25 credits
- $5.00 = 75 credits

Each statement analysis consumes 1 credit.


## Security Features

- User authentication with Supabase
- Data encryption for sensitive information
- Secure payment processing with Stripe
- GDPR and CCPA compliance measures

- Input validation and sanitization

---

**Note:** This repository was reorganized in October 2025. All code is now at the root. If you are looking for the legacy SDK or previous structure, see the `archive/` directory.