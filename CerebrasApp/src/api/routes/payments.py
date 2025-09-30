from fastapi import APIRouter, Depends, HTTPException, status
from src.models.schemas import User, CreditPackage
from src.services.auth import AuthService
from src.services.payment import PaymentService
from src.services.user import UserService
from src.core.config import settings

router = APIRouter()
auth_service = AuthService()
payment_service = PaymentService()
user_service = UserService()

@router.get("/packages")
async def get_credit_packages():
    """Get available credit packages"""
    return settings.CREDIT_PACKAGES

@router.post("/create-intent")
async def create_payment_intent(
    package: CreditPackage,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Create a Stripe payment intent for credit purchase"""
    try:
        intent = await payment_service.create_payment_intent(
            amount=package.amount,
            user_id=current_user.id,
            credits=package.credits
        )
        return {"client_secret": intent.client_secret}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/webhook")
async def stripe_webhook(payload: dict):
    """Handle Stripe webhook events"""
    try:
        event = payment_service.construct_event(payload)
        
        if event.type == "payment_intent.succeeded":
            payment_intent = event.data.object
            metadata = payment_intent.metadata
            
            # Add credits to user's account
            await user_service.add_credits(
                user_id=metadata.user_id,
                credits=int(metadata.credits)
            )
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )