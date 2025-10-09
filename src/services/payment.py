import stripe
from typing import Dict, Any
from src.core.config import settings

class PaymentService:
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
    
    async def create_payment_intent(
        self,
        amount: int,
        user_id: str,
        credits: int
    ) -> stripe.PaymentIntent:
        """Create a Stripe payment intent for credit purchase"""
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,  # amount in cents
                currency="usd",
                metadata={
                    "user_id": user_id,
                    "credits": credits
                }
            )
            return intent
        except stripe.error.StripeError as e:
            raise Exception(f"Error creating payment intent: {str(e)}")
    
    def construct_event(self, payload: Dict[str, Any]) -> stripe.Event:
        """Construct a Stripe event from webhook payload"""
        try:
            event = stripe.Event.construct_from(
                payload,
                stripe.api_key
            )
            return event
        except Exception as e:
            raise Exception(f"Error constructing Stripe event: {str(e)}")
    
    def validate_credit_package(self, amount: int) -> int:
        """Validate credit package amount and return number of credits"""
        for package in settings.CREDIT_PACKAGES:
            if package["amount"] == amount:
                return package["credits"]
        raise Exception("Invalid credit package amount")