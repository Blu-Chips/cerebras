from typing import Optional
from datetime import datetime
from src.models.schemas import User, UserCreate
from supabase import create_client
from src.core.config import settings

class UserService:
    def __init__(self):
        self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    async def create_user(self, user_data: UserCreate) -> Optional[User]:
        """Create a new user account"""
        try:
            response = self.supabase.auth.sign_up({
                "email": user_data.email,
                "password": user_data.password
            })
            
            # Create user profile in database
            user_profile = self.supabase.table("users").insert({
                "id": response.user.id,
                "email": user_data.email,
                "credits": settings.NEW_USER_CREDITS,
                "created_at": datetime.now().isoformat()
            }).execute()
            
            return User(**user_profile.data[0])
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        try:
            response = self.supabase.table("users").select("*").eq("email", email).execute()
            if response.data:
                return User(**response.data[0])
            return None
        except Exception as e:
            print(f"Error fetching user: {e}")
            return None
    
    async def get_credits(self, user_id: str) -> int:
        """Get user's credit balance"""
        try:
            response = self.supabase.table("users").select("credits").eq("id", user_id).execute()
            if response.data:
                return response.data[0]["credits"]
            return 0
        except Exception as e:
            print(f"Error fetching credits: {e}")
            return 0
    
    async def add_credits(self, user_id: str, amount: int) -> bool:
        """Add credits to user's account"""
        try:
            current_credits = await self.get_credits(user_id)
            new_credits = current_credits + amount
            
            self.supabase.table("users").update({
                "credits": new_credits
            }).eq("id", user_id).execute()
            
            return True
        except Exception as e:
            print(f"Error adding credits: {e}")
            return False
    
    async def deduct_credit(self, user_id: str) -> bool:
        """Deduct one credit from user's account"""
        try:
            current_credits = await self.get_credits(user_id)
            if current_credits <= 0:
                return False
            
            new_credits = current_credits - 1
            self.supabase.table("users").update({
                "credits": new_credits
            }).eq("id", user_id).execute()
            
            return True
        except Exception as e:
            print(f"Error deducting credit: {e}")
            return False
    
    async def get_user_stats(self, user_id: str) -> dict:
        """Get user's usage statistics"""
        try:
            response = self.supabase.table("statements").select("*").eq("user_id", user_id).execute()
            return {
                "total_statements": len(response.data),
                "credits_used": len(response.data),
                "last_upload": response.data[-1]["created_at"] if response.data else None
            }
        except Exception as e:
            print(f"Error fetching user stats: {e}")
            return {
                "total_statements": 0,
                "credits_used": 0,
                "last_upload": None
            }