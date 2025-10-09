import os
import stripe
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class StripeClient:
    def __init__(self):
        self.api_key = os.getenv("STRIPE_SECRET_KEY")
        stripe.api_key = self.api_key
    
    def create_payment_intent(self, amount, currency="usd"):
        """Create a payment intent for credit purchase"""
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
                metadata={
                    "credits": self._calculate_credits(amount)
                }
            )
            return intent
        except Exception as e:
            raise Exception(f"Error creating payment intent: {str(e)}")
    
    def _calculate_credits(self, amount_cents):
        """Calculate credits based on payment amount"""
        amount_dollars = amount_cents / 100
        
        if amount_dollars == 0.5:
            return 5
        elif amount_dollars == 2:
            return 25
        elif amount_dollars == 5:
            return 75
        else:
            # Default calculation (5 credits per dollar)
            return int(amount_dollars * 10)
    
    def get_credit_packages(self):
        """Get available credit packages"""
        return [
            {"amount": 50, "credits": 5, "description": "$0.50 for 5 credits"},
            {"amount": 200, "credits": 25, "description": "$2.00 for 25 credits"},
            {"amount": 500, "credits": 75, "description": "$5.00 for 75 credits"}
        ]

# Initialize client
stripe_client = StripeClient()