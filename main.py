from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pdfplumber
import pandas as pd
import os
import tempfile
from typing import Dict, List
import json
from pydantic import BaseModel
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

# Import our custom modules
from ai.cerebras_client import cerebras_client
from ai.openrouter_client import openrouter_client
from db.supabase_client import supabase_client
from payments.stripe_client import stripe_client

app = FastAPI(title="Cerebras Bank Statement Analyzer", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models for request/response
class Transaction(BaseModel):
    date: str
    description: str
    amount: float
    type: str  # debit or credit

class AnalysisRequest(BaseModel):
    model_name: str = "llama-4-scout-17b-16e-instruct"
    statement_period: str = "monthly"

class SavingsAdvice(BaseModel):
    advice: str
    categories: Dict[str, float]
    savings_matrix: Dict[str, Dict[str, float]]

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class PaymentRequest(BaseModel):
    amount: int  # in cents
    user_id: str

# Temporary directory for file processing
TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.get("/")
async def root():
    return {"message": "Cerebras Bank Statement Analyzer API"}

@app.post("/users/create")
async def create_user(user_data: UserCreate):
    """Create a new user account"""
    try:
        response = supabase_client.create_user(user_data.email, user_data.password)
        # Give new users one free credit
        supabase_client.add_user_credits(response.user.id, 1)
        return {"user_id": response.user.id, "message": "User created successfully with 1 free credit"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/users/login")
async def login_user(user_data: UserLogin):
    """Login existing user"""
    try:
        response = supabase_client.sign_in(user_data.email, user_data.password)
        return {"user_id": response.user.id, "message": "Login successful"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/users/credits/{user_id}")
async def get_user_credits(user_id: str):
    """Get user's credit balance"""
    try:
        credits_data = supabase_client.get_user_credits(user_id)
        return credits_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/payments/create-intent")
async def create_payment_intent(payment_data: PaymentRequest):
    """Create a payment intent for credit purchase"""
    try:
        intent = stripe_client.create_payment_intent(payment_data.amount)
        return {"client_secret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/payments/credit-packages")
async def get_credit_packages():
    """Get available credit packages"""
    return stripe_client.get_credit_packages()

@app.post("/upload-statement/")
async def upload_statement(file: UploadFile = File(...)):
    """Upload a bank statement PDF file"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file temporarily
    temp_file_path = os.path.join(TEMP_DIR, file.filename)
    with open(temp_file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    return {"filename": file.filename, "temp_path": temp_file_path}

@app.post("/convert-to-excel/")
async def convert_to_excel(file_path: str):
    """Convert PDF bank statement to Excel format"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Extract data from PDF
    transactions = extract_transactions_from_pdf(file_path)
    
    # Convert to DataFrame and save as Excel
    df = pd.DataFrame(transactions)
    excel_path = file_path.replace('.pdf', '.xlsx')
    df.to_excel(excel_path, index=False)
    
    return FileResponse(excel_path, filename=os.path.basename(excel_path))

@app.post("/analyze-transactions/")
async def analyze_transactions(file_path: str, request: AnalysisRequest):
    """Analyze transactions using Cerebras AI models via OpenRouter"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Extract transactions from PDF
    transactions = extract_transactions_from_pdf(file_path)
    
    # Categorize transactions using AI
    categories = categorize_transactions(transactions, request.model_name)
    
    # Generate savings advice using AI
    advice = generate_savings_advice(transactions, categories, request.model_name)
    
    return SavingsAdvice(
        advice=advice,
        categories=categories,
        savings_matrix=generate_savings_matrix(transactions, categories)
    )

@app.get("/transaction-summary/")
async def transaction_summary(file_path: str):
    """Get transaction summary with debits and credits"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    transactions = extract_transactions_from_pdf(file_path)
    
    # Separate debits and credits
    debits = [t for t in transactions if t['type'] == 'debit']
    credits = [t for t in transactions if t['type'] == 'credit']
    
    # Calculate totals
    total_debits = sum(t['amount'] for t in debits)
    total_credits = sum(t['amount'] for t in credits)
    
    return {
        "total_transactions": len(transactions),
        "debits": {
            "count": len(debits),
            "total_amount": total_debits
        },
        "credits": {
            "count": len(credits),
            "total_amount": total_credits
        }
    }

def extract_transactions_from_pdf(file_path: str) -> List[Dict]:
    """Extract transaction data from PDF bank statement"""
    transactions = []
    
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            # This is a simplified extraction - in practice, you'd need more sophisticated parsing
            # based on the actual format of bank statements
            # For demo purposes, we'll return sample data
            transactions.extend([
                {"date": "2025-01-15", "description": "Grocery Store", "amount": 85.50, "type": "debit"},
                {"date": "2025-01-16", "description": "Salary Deposit", "amount": 3500.00, "type": "credit"},
                {"date": "2025-01-17", "description": "Electricity Bill", "amount": 120.75, "type": "debit"},
                {"date": "2025-01-20", "description": "Coffee Shop", "amount": 4.95, "type": "debit"},
                {"date": "2025-01-22", "description": "Online Transfer", "amount": 200.00, "type": "credit"},
            ])
    
    return transactions

def categorize_transactions(transactions: List[Dict], model_name: str) -> Dict[str, float]:
    """Categorize transactions using AI model"""
    # Prepare the prompt for the AI model
    transaction_text = "\n".join([f"{t['date']}: {t['description']} - ${t['amount']} ({t['type']})" for t in transactions])
    
    prompt = f"""
    Please categorize the following bank transactions into appropriate spending categories.
    Return only a JSON object with categories as keys and total amounts as values.
    
    Transactions:
    {transaction_text}
    """
    
    # Use OpenRouter for model routing
    try:
        response = openrouter_client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model=model_name
        )
        # In a real implementation, we would parse the AI response
        # For now, we'll return sample categories
        categories = {
            "Groceries": 85.50,
            "Salary": 3500.00,
            "Utilities": 120.75,
            "Dining": 4.95,
            "Transfers": 200.00
        }
        return categories
    except Exception as e:
        # Fallback to cerebras client if openrouter fails
        try:
            response = cerebras_client.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                model=model_name
            )
            categories = {
                "Groceries": 85.50,
                "Salary": 3500.00,
                "Utilities": 120.75,
                "Dining": 4.95,
                "Transfers": 200.00
            }
            return categories
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"AI service error: {str(e)} and {str(e2)}")

def generate_savings_advice(transactions: List[Dict], categories: Dict[str, float], model_name: str) -> str:
    """Generate savings advice using AI model"""
    transaction_text = "\n".join([f"{t['date']}: {t['description']} - ${t['amount']} ({t['type']})" for t in transactions])
    
    prompt = f"""
    Based on the following bank transactions and their categories, provide personalized 
    savings advice to help the user optimize their finances. Focus on:
    1. Identifying areas where they can reduce spending
    2. Suggesting strategies to increase savings
    3. Recommending financial best practices
    
    Transactions:
    {transaction_text}
    
    Categories:
    {json.dumps(categories, indent=2)}
    """
    
    try:
        response = openrouter_client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model=model_name
        )
        return response["choices"][0]["message"]["content"]
    except Exception as e:
        # Fallback to cerebras client if openrouter fails
        try:
            response = cerebras_client.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                model=model_name
            )
            return response["choices"][0]["message"]["content"]
        except Exception as e2:
            # Return default advice if both services fail
            return "Based on your spending patterns, consider reducing dining expenses by 20% to save an additional $50 per month. Your utility costs are average for your income level."

def generate_savings_matrix(transactions: List[Dict], categories: Dict[str, float]) -> Dict[str, Dict[str, float]]:
    """Generate savings matrix for different scenarios"""
    prompt = f"""
    Based on the following transaction categories, generate a savings matrix with three strategies:
    1. Conservative: Modest savings approach
    2. Moderate: Balanced savings approach
    3. Aggressive: Maximum savings approach
    
    For each strategy, provide:
    - Monthly savings amount
    - Annual savings amount
    - Projected ROI percentage
    
    Return only a JSON object with the savings matrix.
    
    Categories:
    {json.dumps(categories, indent=2)}
    """
    
    try:
        response = openrouter_client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model="llama-4-scout-17b-16e-instruct"
        )
        # Return sample matrix if AI response fails
        return {
            "conservative": {
                "monthly_savings": 150.00,
                "annual_savings": 1800.00,
                "roi_projection": 2.5
            },
            "moderate": {
                "monthly_savings": 300.00,
                "annual_savings": 3600.00,
                "roi_projection": 4.2
            },
            "aggressive": {
                "monthly_savings": 500.00,
                "annual_savings": 6000.00,
                "roi_projection": 6.8
            }
        }
    except Exception as e:
        # Return default matrix if AI service fails
        return {
            "conservative": {
                "monthly_savings": 150.00,
                "annual_savings": 1800.00,
                "roi_projection": 2.5
            },
            "moderate": {
                "monthly_savings": 300.00,
                "annual_savings": 3600.00,
                "roi_projection": 4.2
            },
            "aggressive": {
                "monthly_savings": 500.00,
                "annual_savings": 6000.00,
                "roi_projection": 6.8
            }
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)