from fastapi import APIRouter, Depends, HTTPException, status
from src.models.schemas import User
from src.services.auth import AuthService
from src.services.ai import AIService

router = APIRouter()
auth_service = AuthService()
ai_service = AIService()

@router.get("/models")
async def list_available_models():
    """List available AI models"""
    return await ai_service.list_models()

@router.post("/categorize")
async def categorize_transactions(
    transactions: list,
    model_name: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Categorize transactions using AI"""
    try:
        categories = await ai_service.categorize_transactions(transactions, model_name)
        return categories
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/analyze")
async def analyze_spending(
    transactions: list,
    categories: dict,
    model_name: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Generate financial advice and savings matrix"""
    try:
        analysis = await ai_service.analyze_spending(
            transactions=transactions,
            categories=categories,
            model_name=model_name
        )
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )