import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseClient:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        self.client: Client = create_client(self.url, self.key)
    
    def create_user(self, email, password):
        """Create a new user account"""
        try:
            response = self.client.auth.sign_up({
                "email": email,
                "password": password
            })
            return response
        except Exception as e:
            raise Exception(f"Error creating user: {str(e)}")
    
    def sign_in(self, email, password):
        """Sign in existing user"""
        try:
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            return response
        except Exception as e:
            raise Exception(f"Error signing in: {str(e)}")
    
    def get_user_credits(self, user_id):
        """Get user's credit balance"""
        try:
            response = self.client.table("credits").select("*").eq("user_id", user_id).execute()
            return response.data[0] if response.data else {"balance": 0}
        except Exception as e:
            raise Exception(f"Error fetching credits: {str(e)}")
    
    def add_user_credits(self, user_id, amount):
        """Add credits to user's account"""
        try:
            response = self.client.table("credits").upsert({
                "user_id": user_id,
                "balance": amount
            }).execute()
            return response
        except Exception as e:
            raise Exception(f"Error adding credits: {str(e)}")
    
    def deduct_user_credit(self, user_id):
        """Deduct one credit from user's account"""
        try:
            # Get current balance
            credits_data = self.get_user_credits(user_id)
            current_balance = credits_data["balance"]
            
            if current_balance <= 0:
                raise Exception("Insufficient credits")
            
            # Update balance
            new_balance = current_balance - 1
            response = self.client.table("credits").upsert({
                "user_id": user_id,
                "balance": new_balance
            }).execute()
            
            return response
        except Exception as e:
            raise Exception(f"Error deducting credit: {str(e)}")

# Initialize client
supabase_client = SupabaseClient()