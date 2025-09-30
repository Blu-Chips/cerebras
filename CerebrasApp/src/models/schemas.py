from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    is_active: bool = True
    credits: int = 0
    created_at: datetime

class Transaction(BaseModel):
    date: str
    description: str
    amount: float
    type: str  # debit or credit
    category: Optional[str] = None

class StatementAnalysis(BaseModel):
    user_id: str
    file_id: str
    transactions: List[Transaction]
    categories: Dict[str, float]
    savings_advice: str
    savings_matrix: Dict[str, Dict[str, float]]
    created_at: datetime = datetime.now()

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

class CreditPackage(BaseModel):
    amount: int  # in cents
    credits: int
    description: str