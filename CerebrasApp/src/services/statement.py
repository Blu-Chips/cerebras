import os
import pdfplumber
import pandas as pd
from typing import Dict, List, Optional
from fastapi import UploadFile
from datetime import datetime
from src.core.config import settings
from src.services.ai import AIService

class StatementService:
    def __init__(self):
        self.ai_service = AIService()
        self.upload_dir = settings.UPLOAD_DIR
        os.makedirs(self.upload_dir, exist_ok=True)
    
    async def process_statement(self, file: UploadFile, user_id: str) -> Dict:
        """Process uploaded bank statement"""
        # Save file
        file_id = f"{user_id}_{datetime.now().timestamp()}"
        file_path = os.path.join(self.upload_dir, f"{file_id}.pdf")
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Extract transactions
        transactions = await self.extract_transactions(file_path)
        
        # Analyze with AI
        categories = await self.ai_service.categorize_transactions(
            transactions,
            "llama-4-scout-17b-16e-instruct"  # Default model
        )
        
        analysis = await self.ai_service.analyze_spending(
            transactions,
            categories,
            "llama-4-scout-17b-16e-instruct"  # Default model
        )
        
        # Convert to Excel
        await self.convert_to_excel(transactions, file_id)
        
        return {
            "file_id": file_id,
            "transactions": transactions,
            "categories": categories,
            "analysis": analysis
        }
    
    async def extract_transactions(self, file_path: str) -> List[Dict]:
        """Extract transaction data from PDF"""
        transactions = []
        
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                # Here you would implement the actual PDF parsing logic
                # This is a placeholder that returns sample data
                transactions.extend([
                    {
                        "date": "2025-01-15",
                        "description": "Grocery Store",
                        "amount": 85.50,
                        "type": "debit"
                    },
                    {
                        "date": "2025-01-16",
                        "description": "Salary Deposit",
                        "amount": 3500.00,
                        "type": "credit"
                    }
                ])
        
        return transactions
    
    async def convert_to_excel(self, transactions: List[Dict], file_id: str) -> str:
        """Convert transactions to Excel format"""
        df = pd.DataFrame(transactions)
        excel_path = os.path.join(self.upload_dir, f"{file_id}.xlsx")
        df.to_excel(excel_path, index=False)
        return excel_path
    
    async def get_analysis(self, file_id: str, user_id: str) -> Optional[Dict]:
        """Retrieve analysis results for a specific statement"""
        # In a real implementation, this would fetch from a database
        # This is a placeholder that returns sample data
        return {
            "file_id": file_id,
            "user_id": user_id,
            "transactions": [
                {
                    "date": "2025-01-15",
                    "description": "Grocery Store",
                    "amount": 85.50,
                    "type": "debit"
                }
            ],
            "categories": {
                "Groceries": 85.50
            },
            "analysis": {
                "advice": "Consider reducing grocery expenses...",
                "savings_matrix": {
                    "conservative": {
                        "monthly_savings": 150.00,
                        "annual_savings": 1800.00,
                        "roi_projection": 2.5
                    }
                }
            }
        }
    
    async def get_excel_file(self, file_id: str, user_id: str) -> Optional[str]:
        """Retrieve Excel file for a specific statement"""
        excel_path = os.path.join(self.upload_dir, f"{file_id}.xlsx")
        if os.path.exists(excel_path):
            return excel_path
        return None